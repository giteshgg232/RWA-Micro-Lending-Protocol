"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACTS } from "../../../lib/contracts";
import BackButton from "../../../components/BackButton";
import { FiLoader, FiAlertCircle, FiCheckCircle } from "react-icons/fi";

export default function FundLoanPage() {
  const [loanId, setLoanId] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState("0");

  useEffect(() => {
    loadBalance();
  }, []);

  async function getSigner() {
    if (!window.ethereum) throw new Error("Wallet not connected");

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    return provider.getSigner();
  }

  async function loadBalance() {
    try {
      const signer = await getSigner();
      const usdc = new ethers.Contract(
        CONTRACTS.stablecoin.address,
        CONTRACTS.stablecoin.abi,
        signer
      );

      const addr = await signer.getAddress();
      const bal = await usdc.balanceOf(addr);
      setUsdcBalance(ethers.utils.formatUnits(bal, 18));
    } catch (e) {
      console.warn("Balance error:", e);
    }
  }

  async function fund() {
    try {
      setStatus("");
      setLoading(true);

      if (!loanId || !amount) throw new Error("Loan ID and Amount required");

      const signer = await getSigner();

      const usdc = new ethers.Contract(
        CONTRACTS.stablecoin.address,
        CONTRACTS.stablecoin.abi,
        signer
      );

      const loanManager = new ethers.Contract(
        CONTRACTS.loanManager.address,
        CONTRACTS.loanManager.abi,
        signer
      );

      const parsed = ethers.utils.parseUnits(amount, 18);

      // --- APPROVE ---
      setStatus("Approving USDC…");
      const tx1 = await usdc.approve(CONTRACTS.loanManager.address, parsed);
      await tx1.wait();

      // --- FUND ---
      setStatus("Funding loan…");
      const tx2 = await loanManager.fundPartial(Number(loanId), parsed);
      await tx2.wait();

      setStatus("✔ Funding Complete!");
      setLoading(false);
      loadBalance();
    } catch (e) {
      console.error(e);
      setStatus("❌ Error: " + (e.reason || e.message));
      setLoading(false);
    }
  }

  return (
    <main className="p-6 max-w-lg mx-auto space-y-6">

      {/* BACK BUTTON */}
      <BackButton label="Back" />

      {/* TITLE */}
      <h1 className="text-3xl font-bold">Fund a Loan</h1>
      <p className="text-gray-500">Provide capital to borrowers.</p>

      {/* USDC BALANCE */}
      <div className="p-3 bg-blue-50 text-blue-700 rounded border border-blue-200">
        <strong>Your USDC Balance:</strong> {usdcBalance}
      </div>

      {/* INPUTS */}
      <input
        className="input"
        placeholder="Loan ID"
        value={loanId}
        onChange={(e) => setLoanId(e.target.value)}
      />

      <input
        className="input"
        placeholder="Amount to fund"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      {/* ACTION BUTTON */}
      <button
        className="btn-primary w-full flex items-center justify-center gap-2"
        onClick={fund}
        disabled={loading}
      >
        {loading && <FiLoader className="animate-spin" />}
        Fund Loan
      </button>

      {/* STATUS */}
      {status && (
        <div
          className={`p-3 rounded border ${
            status.startsWith("✔")
              ? "bg-green-50 text-green-700 border-green-300"
              : status.startsWith("❌")
              ? "bg-red-50 text-red-700 border-red-300"
              : "bg-gray-50 text-gray-700 border-gray-300"
          }`}
        >
          {status.startsWith("✔") && <FiCheckCircle className="inline mr-1" />}
          {status.startsWith("❌") && <FiAlertCircle className="inline mr-1" />}
          {status}
        </div>
      )}
    </main>
  );
}
