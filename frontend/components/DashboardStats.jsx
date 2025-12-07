'use client';

import { useEffect, useState } from 'react';
import { CONTRACTS } from '../lib/contracts';
import { ethers } from 'ethers';

export default function DashboardStats() {
  const [stats, setStats] = useState({
    totalLoans: 0,
    requested: 0,
    funding: 0,
    funded: 0,
    repaid: 0,
    defaulted: 0,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  async function getReadProvider() {
    // Prefer a local JSON-RPC read provider to avoid MetaMask network mismatch.
    try {
      const rpc = (typeof window !== 'undefined' && window.location.hostname === 'localhost') ? 'http://127.0.0.1:8545' : (process.env.NEXT_PUBLIC_RPC || 'http://127.0.0.1:8545');
      const jsonProvider = new ethers.providers.JsonRpcProvider(rpc);
      // quick check: ensure provider responds
      await jsonProvider.getBlockNumber();
      return jsonProvider;
    } catch (err) {
      // fallback to injected provider (MetaMask) for reads
      if (typeof window !== 'undefined' && window.ethereum) {
        return new ethers.providers.Web3Provider(window.ethereum);
      }
      throw new Error("No read provider available (no local node and no window.ethereum).");
    }
  }

  async function fetchStats() {
    try {
      setError(null);

      // --- Debug logs to help diagnose issues remotely ---
      console.log("LoanManager address:", CONTRACTS.loanManager.address);
      console.log("LoanManager ABI length:", CONTRACTS.loanManager.abi?.length);

      // Use read-only provider to avoid MetaMask network mismatch
      const provider = await getReadProvider();
      const net = await provider.getNetwork();
      console.log("Read provider network:", net);

      // Check if the contract has code at that address (helps diagnose "no code" problems)
      const code = await provider.getCode(CONTRACTS.loanManager.address);
      console.log("Contract bytecode length:", code.length, code === "0x" ? "no code at address!" : "code found");

      if (code === "0x") {
        setError(`No contract code at LoanManager address ${CONTRACTS.loanManager.address} on network ${net.name} (${net.chainId}). Make sure your frontend addresses.json matches the network your node is running on.`);
        return;
      }

      // Instantiate contract with the ABI
      const contract = new ethers.Contract(
        CONTRACTS.loanManager.address,
        CONTRACTS.loanManager.abi,
        provider
      );

      // call the getter
      const loanCountBN = await contract.loanCounter();
      const loanCount = loanCountBN.toNumber ? loanCountBN.toNumber() : Number(loanCountBN);

      let s = { totalLoans: loanCount, requested: 0, funding: 0, funded: 0, repaid: 0, defaulted: 0 };

      for (let i = 1; i <= loanCount; i++) {
        const loan = await contract.loans(i);
        // loan.state is probably a BigNumber or number - normalize
        const state = typeof loan.state === 'object' && loan.state.toNumber ? loan.state.toNumber() : Number(loan.state);

        if (state === 0) s.requested++;
        else if (state === 1) s.funding++;
        else if (state === 2) s.funded++;
        else if (state === 3) s.repaid++;
        else if (state === 4) s.defaulted++;
      }

      setStats(s);
    } catch (err) {
      console.error("fetchStats error:", err);
      setError(String(err?.message || err));
    }
  }

  return (
    <>
      {error && (
        <div className="card mb-4">
          <strong className="text-red-600">Error:</strong>
          <div className="text-sm text-gray-700">{error}</div>
          <div className="text-xs text-gray-500 mt-2">
            Tip: make sure Hardhat node is running (<code>npx hardhat node</code>) and that you deployed the contracts with the same node. If using MetaMask for writes, switch MetaMask network to "Localhost 8545".
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <StatCard label="Total Loans" value={stats.totalLoans} />
        <StatCard label="Requested" value={stats.requested} />
        <StatCard label="Funding" value={stats.funding} />
        <StatCard label="Funded" value={stats.funded} />
        <StatCard label="Repaid" value={stats.repaid} />
        <StatCard label="Defaulted" value={stats.defaulted} />
      </div>
    </>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="card text-center">
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
