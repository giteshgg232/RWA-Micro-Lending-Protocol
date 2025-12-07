'use client';

import { useEffect, useState } from 'react';
import { CONTRACTS } from '../lib/contracts';
import { ethers } from 'ethers';
import Link from 'next/link';

export default function YourLoans() {
  const [loans, setLoans] = useState([]);
  const [address, setAddress] = useState("");

  useEffect(() => {
    loadLoans();
  }, []);

  async function loadLoans() {
    if (!window.ethereum) return;

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    const signer = provider.getSigner();
    const user = await signer.getAddress();
    setAddress(user);

    const contract = new ethers.Contract(
      CONTRACTS.loanManager.address,
      CONTRACTS.loanManager.abi,
      provider
    );

    const count = await contract.loanCounter();
    let list = [];

    for (let i = 1; i <= count; i++) {
      const loan = await contract.loans(i);
      if (loan.borrower.toLowerCase() === user.toLowerCase()) {
        list.push({ id: i, loan });
      }
    }

    setLoans(list);
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">Your Loans</h2>

      {loans.length === 0 ? (
        <p className="text-gray-500">You have not requested any loans yet.</p>
      ) : (
        loans.map(({ id, loan }) => (
          <div key={id} className="card">
            <p>Loan #{id}</p>
            <p>Principal: {Number(loan.principal) / 1e6} USDC</p>
            <p>Funded: {Number(loan.totalFunded) / 1e6} USDC</p>
            <p>Status: {loan.state.toString()}</p>

            <Link href={`/loan/${id}`} className="btn-primary mt-2 inline-block">
              View Loan
            </Link>
          </div>
        ))
      )}
    </div>
  );
}
