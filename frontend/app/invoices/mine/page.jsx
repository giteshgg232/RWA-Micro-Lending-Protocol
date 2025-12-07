"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACTS } from "../../../lib/contracts";

export default function MyInvoicesPage() {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    try {
      if (!window.ethereum) return alert("Connect wallet first");

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const user = await signer.getAddress();

      const nft = new ethers.Contract(
        CONTRACTS.invoiceNFT.address,
        CONTRACTS.invoiceNFT.abi,
        provider
      );

      const items = [];

      // Invoice IDs start from 1... tokenIdCounter
      for (let i = 1; i < 200; i++) {
        try {
          const owner = await nft.ownerOf(i);
          if (owner.toLowerCase() !== user.toLowerCase()) continue;

          const inv = await nft.getInvoice(i);

          items.push({
            id: i,
            amount: ethers.utils.formatUnits(inv.amount, 18),
            due: new Date(Number(inv.dueDate) * 1000).toLocaleDateString(),
            verified: inv.verified,
            invoiceId: inv.invoiceId,
          });
        } catch (_) {}
      }

      setInvoices(items);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-3xl font-bold">My Invoices</h1>

      {invoices.length === 0 && <p>No invoices found.</p>}

      {invoices.map((inv) => (
        <div key={inv.id} className="p-4 rounded-lg shadow bg-white border">
          <h3 className="font-bold">Invoice #{inv.id}</h3>
          <p>Amount: {inv.amount}</p>
          <p>Due: {inv.due}</p>
          <p>Invoice ID: {inv.invoiceId}</p>
          <p>
            Status:{" "}
            {inv.verified ? (
              <span className="text-green-600 font-bold">Verified</span>
            ) : (
              <span className="text-red-600 font-bold">Unverified</span>
            )}
          </p>
        </div>
      ))}
    </main>
  );
}
