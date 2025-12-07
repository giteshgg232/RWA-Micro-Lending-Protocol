"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { CONTRACTS } from "../../../lib/contracts";
import BackButton from "../../../components/BackButton";
import { FiLoader, FiAlertCircle, FiCheckCircle } from "react-icons/fi";

export default function RequestLoanPage() {
  const [form, setForm] = useState({
    tokenId: "",
    principal: "",
    interest: "",
    duration: "",
  });

  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function requestLoan() {
    try {
      if (!window.ethereum) return alert("Connect wallet first");

      if (!form.tokenId || !form.principal || !form.interest || !form.duration)
        return setStatus("Please fill all fields.");

      setLoading(true);
      setStatus("");

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const loanManager = new ethers.Contract(
        CONTRACTS.loanManager.address,
        CONTRACTS.loanManager.abi,
        signer
      );

      const principalWei = ethers.utils.parseUnits(form.principal, 18);

      setStatus("Submitting loan request...");

      const tx = await loanManager.requestLoan(
        Number(form.tokenId),
        principalWei,
        Number(form.interest),
        Number(form.duration)
      );

      await tx.wait();

      setStatus("Loan request submitted successfully!");
    } catch (e) {
      console.error(e);
      setStatus(e.message || "Transaction failed");
    } finally {
      setLoading(false);
    }
  }

  // Preview due date
  const dueDate =
    form.duration && !isNaN(form.duration)
      ? new Date(Date.now() + Number(form.duration) * 24 * 60 * 60 * 1000)
      : null;

  return (
    <main className="p-6 max-w-xl mx-auto space-y-6">

      <BackButton label="Back to Dashboard" />

      {/* TITLE */}
      <div>
        <h1 className="text-3xl font-bold">Request a Loan</h1>
        <p className="text-gray-500">
          Borrow against your verified Invoice NFT.
        </p>
      </div>

      {/* FORM CARD */}
      <div className="p-5 bg-white rounded-xl shadow space-y-4 border">

        <div className="space-y-1">
          <label className="text-sm font-medium">Invoice Token ID</label>
          <input
            className="input w-full"
            placeholder="NFT ID (e.g., 1)"
            value={form.tokenId}
            onChange={(e) => update("tokenId", e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Principal Amount</label>
          <input
            className="input w-full"
            placeholder="Amount in USDC"
            value={form.principal}
            onChange={(e) => update("principal", e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Interest (bps)</label>
          <input
            className="input w-full"
            placeholder="Example: 500 = 5%"
            value={form.interest}
            onChange={(e) => update("interest", e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Duration (days)</label>
          <input
            className="input w-full"
            placeholder="Loan term in days"
            value={form.duration}
            onChange={(e) => update("duration", e.target.value)}
          />
        </div>

        {dueDate && (
          <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
            Estimated Due Date:{" "}
            <span className="font-semibold">
              {dueDate.toLocaleDateString()}
            </span>
          </div>
        )}

        <button
          className="btn-primary w-full flex items-center justify-center gap-2"
          onClick={requestLoan}
          disabled={loading}
        >
          {loading && <FiLoader className="animate-spin" />}
          Submit Loan Request
        </button>
      </div>

      {/* STATUS ALERT */}
      {status && (
        <div
          className={`p-3 rounded flex items-center gap-2 ${
            status.toLowerCase().includes("success")
              ? "bg-green-100 text-green-700"
              : status.toLowerCase().includes("failed") ||
                status.toLowerCase().includes("error")
              ? "bg-red-100 text-red-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {status.toLowerCase().includes("success") ? (
            <FiCheckCircle />
          ) : status.toLowerCase().includes("error") ? (
            <FiAlertCircle />
          ) : (
            <FiLoader className="animate-spin" />
          )}
          {status}
        </div>
      )}
    </main>
  );
}
