'use client';

import { useState } from "react";
import { ethers } from "ethers";
import { CONTRACTS } from "../../../lib/contracts";
import { FiAlertTriangle, FiCheckCircle, FiLoader } from "react-icons/fi";
import BackButton from "../../../components/BackButton";

export default function MarkDefaultPage() {
  const [loanId, setLoanId] = useState("");
  const [loanInfo, setLoanInfo] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function getProvider() {
    if (!window.ethereum) throw new Error("Please connect MetaMask");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    return provider;
  }

  async function loadLoanDetails() {
    try {
      setStatus("");
      setLoanInfo(null);

      if (!loanId) return setStatus("❌ Enter a Loan ID");

      const provider = await getProvider();
      const loanManager = new ethers.Contract(
        CONTRACTS.loanManager.address,
        CONTRACTS.loanManager.abi,
        provider
      );

      const loan = await loanManager.loans(Number(loanId));

      if (loan.loanId.toString() === "0") {
        setStatus("⚠ Loan not found.");
        return;
      }

      setLoanInfo({
        borrower: loan.borrower,
        state: Number(loan.state),
        principal: ethers.utils.formatUnits(loan.principal, 18),
        dueDate: new Date(Number(loan.dueDate) * 1000).toLocaleDateString(),
      });
    } catch (err) {
      console.error(err);
      setStatus("❌ " + err.message);
    }
  }

  async function markDefault() {
    try {
      setStatus("");
      if (!loanId) return setStatus("❌ Loan ID required");

      setLoading(true);

      const provider = await getProvider();
      const signer = provider.getSigner();

      const loanManager = new ethers.Contract(
        CONTRACTS.loanManager.address,
        CONTRACTS.loanManager.abi,
        signer
      );

      setStatus("⏳ Marking as default...");

      const tx = await loanManager.markDefault(Number(loanId));
      await tx.wait();

      setStatus("✅ Loan marked as DEFAULT");
      setLoading(false);
    } catch (err) {
      console.error(err);
      setStatus("❌ " + err.message);
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <BackButton label="Back" />
      <h1 className="text-3xl font-bold">Mark Loan as Default</h1>
      <p className="text-gray-600">
        Only admins or oracle accounts can default a loan once it has passed its due date.
      </p>

      {/* LOAN INPUT */}
      <div className="space-y-3">
        <label className="font-semibold">Loan ID</label>
        <input
          className="w-full border p-3 rounded bg-gray-50 focus:ring focus:ring-blue-300"
          placeholder="Enter loan ID"
          value={loanId}
          onChange={(e) => setLoanId(e.target.value)}
        />

        <button
          onClick={loadLoanDetails}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow"
        >
          Load Loan Details
        </button>
      </div>

      {/* LOAN INFO BOX */}
      {loanInfo && (
        <div className="p-4 bg-white shadow rounded border border-gray-200 space-y-2">
          <h3 className="text-lg font-bold">Loan Details</h3>
          <p><strong>Borrower:</strong> {loanInfo.borrower}</p>
          <p><strong>Principal:</strong> {loanInfo.principal} USDC</p>
          <p><strong>Due Date:</strong> {loanInfo.dueDate}</p>
          <p>
            <strong>Status:</strong>{" "}
            {["Requested", "Funding", "Funded", "Repaid", "Defaulted", "Cancelled"][loanInfo.state]}
          </p>
        </div>
      )}

      {/* MARK DEFAULT BUTTON */}
      {loanInfo && (
        <button
          onClick={markDefault}
          disabled={loading}
          className={`w-full py-3 rounded text-white font-bold transition ${
            loading ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {loading ? (
            <span className="flex justify-center items-center gap-2">
              <FiLoader className="animate-spin" /> Processing...
            </span>
          ) : (
            "Mark Loan as Default"
          )}
        </button>
      )}

      {/* STATUS MESSAGE */}
      {status && (
        <div
          className={`p-3 rounded text-sm ${
            status.includes("❌")
              ? "bg-red-100 text-red-800"
              : status.includes("⚠")
              ? "bg-yellow-100 text-yellow-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {status}
        </div>
      )}
    </div>
  );
}
