"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACTS } from "../../../lib/contracts";
import BackButton from "../../../components/BackButton";
import { FiInbox, FiLoader } from "react-icons/fi";

export default function MyLoansPage() {
  const [loans, setLoans] = useState([]);
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLoans();
  }, []);

  async function loadLoans() {
    try {
      if (!window.ethereum) return alert("Connect wallet first");

      setLoading(true);

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const user = await signer.getAddress();
      setAddress(user);

      const contract = new ethers.Contract(
        CONTRACTS.loanManager.address,
        CONTRACTS.loanManager.abi,
        provider
      );

      const count = Number(await contract.loanCounter());
      const items = [];

      for (let i = 1; i <= count; i++) {
        const loan = await contract.loans(i);
        if (loan.borrower.toLowerCase() !== user.toLowerCase()) continue;

        items.push({
          id: i,
          amount: ethers.utils.formatUnits(loan.principal || loan.amount, 18),
          state: Number(loan.state),
          dueDate: Number(loan.dueDate),
        });
      }

      setLoans(items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function statusLabel(s) {
    return ["Requested", "Funding", "Funded", "Repaid", "Defaulted", "Cancelled"][s] || "Unknown";
  }

  function statusColor(s) {
    return [
      "bg-yellow-100 text-yellow-700", // Requested
      "bg-blue-100 text-blue-700",     // Funding
      "bg-green-100 text-green-700",   // Funded
      "bg-gray-200 text-gray-700",     // Repaid
      "bg-red-100 text-red-700",       // Defaulted
      "bg-gray-100 text-gray-600",     // Cancelled
    ][s] || "bg-gray-100 text-gray-600";
  }

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-6">

      {/* Back Button */}
      <BackButton label="Back to Dashboard" />

      <h1 className="text-3xl font-bold">My Loans</h1>

      {address && (
        <p className="text-gray-500">
          Loans created by <span className="font-mono">{address}</span>
        </p>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-16">
          <FiLoader className="animate-spin text-3xl text-gray-600" />
        </div>
      )}

      {/* No Loans */}
      {!loading && loans.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <FiInbox className="mx-auto text-4xl mb-3" />
          You haven't created any loans yet.
        </div>
      )}

      {/* Loan List */}
      <div className="space-y-4">
        {loans.map((loan) => (
          <div
            key={loan.id}
            className="p-5 rounded-lg border shadow-sm bg-white hover:shadow-md transition"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg">Loan #{loan.id}</h3>
              <span className={`px-3 py-1 rounded text-sm font-medium ${statusColor(loan.state)}`}>
                {statusLabel(loan.state)}
              </span>
            </div>

            <p>
              <span className="font-semibold">Amount:</span> {loan.amount} tokens
            </p>
            <p>
              <span className="font-semibold">Due Date:</span>{" "}
              {new Date(loan.dueDate * 1000).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
