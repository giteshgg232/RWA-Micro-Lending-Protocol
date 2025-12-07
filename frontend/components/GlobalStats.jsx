'use client';

import { useEffect, useState } from 'react';
import { CONTRACTS } from '../lib/contracts';
import { ethers } from 'ethers';

export default function GlobalStats() {
  const [pool, setPool] = useState({ total: 0 });
  const [loans, setLoans] = useState({ totalBorrowed: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    if (!window.ethereum) return;

    const provider = new ethers.providers.Web3Provider(window.ethereum);

    // Pool stats
    const poolContract = new ethers.Contract(
      CONTRACTS.pool.address,
      CONTRACTS.pool.abi,
      provider
    );

    try {
      const total = await poolContract.totalDeposits();
      setPool({ total: Number(total) / 1e6 });
    } catch (err) {}

    // Loan stats
    const loanContract = new ethers.Contract(
      CONTRACTS.loanManager.address,
      CONTRACTS.loanManager.abi,
      provider
    );

    const count = await loanContract.loanCounter();
    let borrowed = 0;

    for (let i = 1; i <= count; i++) {
      const loan = await loanContract.loans(i);
      borrowed += Number(loan.totalFunded);
    }

    setLoans({ totalBorrowed: borrowed / 1e6 });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      <div className="card">
        <h3 className="text-lg font-semibold">Total Deposits in Pool</h3>
        <p className="text-2xl font-bold">{pool.total} USDC</p>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold">Total Borrowed</h3>
        <p className="text-2xl font-bold">{loans.totalBorrowed} USDC</p>
      </div>
    </div>
  );
}
