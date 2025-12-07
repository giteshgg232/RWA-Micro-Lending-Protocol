'use client';

import { useEffect, useState, useRef } from "react";
import { ethers } from "ethers";
import { CONTRACTS } from "../lib/contracts";
import { motion } from "framer-motion";
import { FiArrowUpRight, FiArrowDownRight, FiMinus } from "react-icons/fi";

export default function DashboardStats() {
  const [stats, setStats] = useState({
    totalLoans: 0, requested: 0, funding: 0, funded: 0, repaid: 0, defaulted: 0
  });

  const [previousStats, setPreviousStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetchStats();
    const it = setInterval(fetchStats, 5000);
    return () => clearInterval(it);
  }, []);

  async function provider() {
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

  async function fetchStats() {
    try {
      setErr(null);
      setLoading(true);

      const p = await provider();
      const code = await p.getCode(CONTRACTS.loanManager.address);

      if (code === "0x") {
        setErr("⚠ No contract deployed at loanManager address");
        setLoading(false);
        return;
      }

      const contract = new ethers.Contract(
        CONTRACTS.loanManager.address,
        CONTRACTS.loanManager.abi,
        p
      );

      const count = Number(await contract.loanCounter());
      let s = { totalLoans: count, requested: 0, funding: 0, funded: 0, repaid: 0, defaulted: 0 };

      for (let i = 1; i <= count; i++) {
        const loan = await contract.loans(i);
        const st = Number(loan.state);
        if (st === 0) s.requested++;
        else if (st === 1) s.funding++;
        else if (st === 2) s.funded++;
        else if (st === 3) s.repaid++;
        else if (st === 4) s.defaulted++;
      }

      setPreviousStats(stats); // store before overwrite
      setStats(s);
      setLoading(false);

    } catch (e) {
      console.error(e);
      setErr(String(e));
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">

      {/* ERROR */}
      {err && (
        <div className="p-3 bg-red-100 text-red-800 border border-red-300 rounded">
          {err}
        </div>
      )}

      {/* STATS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <StatCard label="Total Loans" value={stats.totalLoans} prev={previousStats?.totalLoans} loading={loading} color="blue" />
        <StatCard label="Requested" value={stats.requested} prev={previousStats?.requested} loading={loading} color="yellow" />
        <StatCard label="Funding" value={stats.funding} prev={previousStats?.funding} loading={loading} color="purple" />
        <StatCard label="Funded" value={stats.funded} prev={previousStats?.funded} loading={loading} color="green" />
        <StatCard label="Repaid" value={stats.repaid} prev={previousStats?.repaid} loading={loading} color="emerald" />
        <StatCard label="Defaulted" value={stats.defaulted} prev={previousStats?.defaulted} loading={loading} color="red" />
      </div>
    </div>
  );
}


/* -------------------- Stat Card With Trend Arrow -------------------- */

function StatCard({ label, value, prev, loading, color }) {
  const trend = prev == null ? 0 : value - prev;

  function TrendIcon() {
    if (trend > 0)
      return <span className="flex items-center text-green-600 text-sm"><FiArrowUpRight /> +{trend}</span>;

    if (trend < 0)
      return <span className="flex items-center text-red-600 text-sm"><FiArrowDownRight /> {trend}</span>;

    return <span className="flex items-center text-gray-400 text-sm"></span>;
  }

  return (
    <div className="p-4 bg-white rounded-xl shadow border border-gray-200 backdrop-blur">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{label}</p>
        {!loading && <TrendIcon />}
      </div>

      {loading ? (
        <div className="animate-pulse h-6 mt-2 rounded bg-gray-200 w-12"></div>
      ) : (
        <motion.p
          key={value}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-2xl font-bold text-${color}-600`}
        >
          {value}
        </motion.p>
      )}
    </div>
  );
}
