"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACTS } from "../../../lib/contracts";
import { FiLoader, FiAlertTriangle } from "react-icons/fi";
import BackButton from "../../../components/BackButton";

export default function AllLoansPage() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    loadLoans();
  }, []);

  async function getProvider() {
    try {
      const rpc = process.env.NEXT_PUBLIC_RPC || "http://127.0.0.1:8545";
      const p = new ethers.providers.JsonRpcProvider(rpc);
      await p.getBlockNumber();
      return p;
    } catch (e) {
      if (typeof window !== "undefined" && window.ethereum)
        return new ethers.providers.Web3Provider(window.ethereum);
      throw e;
    }
  }

  async function loadLoans() {
    try {
      setLoading(true);

      const provider = await getProvider();
      const contract = new ethers.Contract(
        CONTRACTS.loanManager.address,
        CONTRACTS.loanManager.abi,
        provider
      );

      const total = Number(await contract.loanCounter());
      const items = [];

      for (let i = 1; i <= total; i++) {
        const l = await contract.loans(i);
        items.push({
          id: i,
          borrower: l.borrower,
          principal: ethers.utils.formatUnits(l.principal, 18),
          funded: ethers.utils.formatUnits(l.totalFunded, 18),
          invoiceId: l.invoiceTokenId.toString(),
          state: Number(l.state),
          dueDate: l.dueDate.toString(),
        });
      }

      setLoans(items);
      setErr("");
    } catch (e) {
      console.error(e);
      setErr("Failed to load loans: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  function statusLabel(s) {
    return [
      "Requested",
      "Funding",
      "Funded",
      "Repaid",
      "Defaulted",
      "Cancelled",
    ][s] || "Unknown";
  }

  return (
    <main className="p-6 max-w-5xl mx-auto space-y-6">
      
      {/* BACK BUTTON */}
      <BackButton label="Back" />

      {/* TITLE */}
      <h1 className="text-3xl font-bold">All Loans</h1>
      <p className="text-gray-500">Complete list of protocol loans.</p>

      {/* ERROR BANNER */}
      {err && (
        <div className="p-3 bg-red-100 text-red-800 rounded flex items-center gap-2">
          <FiAlertTriangle /> {err}
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="flex justify-center py-10 text-gray-600">
          <FiLoader className="animate-spin mr-2" size={22} />
          Loading loans...
        </div>
      )}

      {/* NO DATA */}
      {!loading && loans.length === 0 && (
        <p className="text-gray-500 text-center py-10">No loans found.</p>
      )}

      {/* LOAN LIST */}
      <div className="space-y-4">
        {loans.map((loan) => (
          <div
            key={loan.id}
            className="p-4 bg-white rounded-lg border shadow-sm hover:shadow-md transition"
          >
            {/* HEADER */}
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">Loan #{loan.id}</h3>

              {/* Status pill */}
              <span
                className={`text-sm px-3 py-1 rounded-full border ${
                  loan.state === 2
                    ? "bg-green-100 text-green-700 border-green-300"
                    : loan.state === 4
                    ? "bg-red-100 text-red-700 border-red-300"
                    : loan.state === 1
                    ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                    : "bg-gray-100 text-gray-700 border-gray-300"
                }`}
              >
                {statusLabel(loan.state)}
              </span>
            </div>

            {/* BODY */}
            <div className="mt-2 space-y-1 text-gray-700">
              <p><strong>Borrower:</strong> {loan.borrower}</p>
              <p><strong>Invoice NFT ID:</strong> #{loan.invoiceId}</p>
              <p><strong>Principal:</strong> {loan.principal} USDC</p>
              <p><strong>Funded:</strong> {loan.funded} / {loan.principal}</p>
              <p>
                <strong>Due Date:</strong>{" "}
                {new Date(Number(loan.dueDate) * 1000).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
