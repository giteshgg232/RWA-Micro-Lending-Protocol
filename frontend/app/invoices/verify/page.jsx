"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { CONTRACTS } from "../../../lib/contracts";

export default function VerifyInvoicePage() {
  const [invoiceId, setInvoiceId] = useState("");
  const [status, setStatus] = useState("");

  async function verify() {
    try {
      if (!window.ethereum) return alert("Connect wallet");

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const nft = new ethers.Contract(
        CONTRACTS.invoiceNFT.address,
        CONTRACTS.invoiceNFT.abi,
        signer
      );

      setStatus("Verifying...");

      await (await nft.verifyInvoice(Number(invoiceId))).wait();

      setStatus("Invoice verified successfully!");
    } catch (e) {
      console.error(e);
      setStatus(String(e));
    }
  }

  return (
    <main className="p-6 max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Verify Invoice</h1>

      <input
        className="input"
        placeholder="Invoice Token ID"
        onChange={(e) => setInvoiceId(e.target.value)}
      />

      <button className="btn-primary" onClick={verify}>
        Verify
      </button>

      {status && <p>{status}</p>}
    </main>
  );
}
