"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { CONTRACTS } from "../../../lib/contracts";

export default function MintInvoicePage() {
  const [form, setForm] = useState({
    amount: "",
    dueDate: "",
    invoiceId: "",
    uri: "",
  });

  const [status, setStatus] = useState("");

  async function mint() {
    try {
      if (!window.ethereum) return alert("Connect wallet first");

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const invoiceNFT = new ethers.Contract(
        CONTRACTS.invoiceNFT.address,
        CONTRACTS.invoiceNFT.abi,
        signer
      );

      const due = Math.floor(new Date(form.dueDate).getTime() / 1000);

      setStatus("Minting invoice...");

      await (await invoiceNFT.mintInvoice(
        await signer.getAddress(),
        ethers.utils.parseUnits(form.amount, 18),
        due,
        form.invoiceId,
        form.uri
      )).wait();

      setStatus("Invoice minted successfully!");
    } catch (e) {
      console.error(e);
      setStatus(String(e));
    }
  }

  return (
    <main className="p-6 max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Mint Invoice NFT</h1>

      <input
        className="input"
        placeholder="Amount"
        onChange={(e) => setForm({ ...form, amount: e.target.value })}
      />

      <input
        type="date"
        className="input"
        onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
      />

      <input
        className="input"
        placeholder="Invoice ID"
        onChange={(e) => setForm({ ...form, invoiceId: e.target.value })}
      />

      <input
        className="input"
        placeholder="Metadata URI"
        onChange={(e) => setForm({ ...form, uri: e.target.value })}
      />

      <button className="btn-primary" onClick={mint}>
        Mint Invoice
      </button>

      {status && <p>{status}</p>}
    </main>
  );
}
