"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { CONTRACTS } from "../../../lib/contracts";
import BackButton from "../../../components/BackButton";
import { FiLoader, FiAlertCircle, FiCheckCircle } from "react-icons/fi";

export default function RepayLoanPage() {
  const [loanId, setLoanId] = useState("");
  const [loanInfo, setLoanInfo] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchDue() {
    try {
      if (!loanId) return;
      if (!window.ethereum) return alert("Connect wallet first");

      setLoading(true);
      setLoanInfo(null);
      setStatus("");

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(
        CONTRACTS.loanManager.address,
        CONTRACTS.loanManager.abi,
        provider
      );

      const due = await contract.totalDue(Number(loanId));
      const loan = await contract.loans(Number(loanId));

      const principal = loan.principal?.toString() || "0";
      const interest = (due - loan.principal)?.toString() || "0";

      setLoanInfo({
        principal: ethers.utils.formatUnits(principal, 18),
        interest: ethers.utils.formatUnits(interest, 18),
        due: ethers.utils.formatUnits(due, 18),
      });
    } catch (e) {
      console.error(e);
      setStatus("Error fetching loan details.");
    } finally {
      setLoading(false);
    }
  }

  async function repay() {
    try {
      if (!window.ethereum) return alert("Connect wallet first");
      if (!loanInfo) return alert("Fetch due amount first.");

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const loanManager = new ethers.Contract(
        CONTRACTS.loanManager.address,
        CONTRACTS.loanManager.abi,
        signer
      );

      const dueRaw = await loanManager.totalDue(Number(loanId));

      const usdc = new ethers.Contract(
        CONTRACTS.stablecoin.address,
        CONTRACTS.stablecoin.abi,
        signer
      );

      setStatus("Approving tokens...");

      await (await usdc.approve(CONTRACTS.loanManager.address, dueRaw)).wait();

      setStatus("Repaying loan...");

      await (await loanManager.repayLoan(Number(loanId))).wait();

      setStatus("Loan repaid successfully!");
    } catch (e) {
      console.error(e);
      setStatus(String(e.message || e));
    }
  }

  return (
    <main className="p-6 max-w-lg mx-auto space-y-6">

      {/* Back Button */}
      <BackButton label="Back to Dashboard" />

      <h1 className="text-3xl font-bold">Repay Loan</h1>
      <p className="text-gray-500">Borrowers can repay their funded loans here.</p>

      {/* Loan ID Input */}
      <div className="space-y-2">
        <input
          className="input w-full"
          placeholder="Enter Loan ID"
          value={loanId}
          onChange={(e) => setLoanId(e.target.value)}
        />

        <button
          onClick={fetchDue}
          className="btn-primary w-full"
        >
          Fetch Amount Due
        </button>
      </div>

      {/* Loading Spinner */}
      {loading && (
        <div className="flex justify-center py-6">
          <FiLoader className="animate-spin text-3xl text-gray-600" />
        </div>
      )}

      {/* Loan Info Card */}
      {loanInfo && (
        <div className="p-4 bg-white rounded-lg shadow border space-y-2">
          <h2 className="text-lg font-semibold">Loan Summary</h2>
          <p><strong>Principal:</strong> {loanInfo.principal}</p>
          <p><strong>Interest:</strong> {loanInfo.interest}</p>
          <p><strong>Total Due:</strong> {loanInfo.due}</p>

          <button
            onClick={repay}
            className="btn-primary w-full mt-3"
          >
            Repay {loanInfo.due} Tokens
          </button>
        </div>
      )}

      {/* Status Message */}
      {status && (
        <div
          className={`p-3 rounded flex items-center gap-2 ${
            status.includes("success")
              ? "bg-green-100 text-green-700"
              : status.toLowerCase().includes("error")
              ? "bg-red-100 text-red-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {status.includes("success") ? (
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
