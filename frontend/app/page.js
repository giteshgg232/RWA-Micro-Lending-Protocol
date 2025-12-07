"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import DashboardStats from "../components/DashboardStats";
import { motion } from "framer-motion";
import { FiArrowRight, FiPlusCircle, FiTrendingUp, FiDollarSign, FiLayers, FiAlertTriangle, FiFilePlus, FiFileText, FiShield } from "react-icons/fi";

export default function Page() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    return (
        <main className="p-6 max-w-6xl mx-auto space-y-10">

            {/* HERO HEADER */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8 rounded-2xl shadow-xl"
            >
                <h1 className="text-4xl font-bold mb-2">RWA Lending Dashboard</h1>
                <p className="text-indigo-100">
                    Real-time analytics for loans, funding activity, repayments, and defaults.
                </p>
            </motion.div>

            {/* STATS SECTION */}
            <section>
                <DashboardStats />
            </section>

            {/* ACTION GRID */}
            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Quick Actions</h2>
                <p className="text-gray-500">Perform key lending operations instantly.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                    <ActionCard
                        title="Request Loan"
                        description="Create a loan request backed by invoice NFTs."
                        icon={<FiPlusCircle className="text-indigo-600" size={28} />}
                        href="/loans/request"
                    />

                    <ActionCard
                        title="Fund Loan"
                        description="Fund active borrower invoices and earn yield."
                        icon={<FiTrendingUp className="text-green-600" size={28} />}
                        href="/loans/fund"
                    />

                    <ActionCard
                        title="Repay Loan"
                        description="Borrowers repay their active funded loans."
                        icon={<FiDollarSign className="text-yellow-600" size={28} />}
                        href="/loans/repay"
                    />

                    <ActionCard
                        title="My Loans"
                        description="View all loans created by your account."
                        icon={<FiLayers className="text-purple-600" size={28} />}
                        href="/loans/mine"
                    />

                    <ActionCard
                        title="All Loans"
                        description="See every loan processed by the protocol."
                        icon={<FiLayers className="text-blue-600" size={28} />}
                        href="/loans/all"
                    />

                    <ActionCard
                        title="Mark Default (Admin)"
                        description="Admin-only: Mark overdue loans as defaulted."
                        icon={<FiAlertTriangle className="text-red-600" size={28} />}
                        href="/admin/default"
                    />
                    <ActionCard
                        title="Mint Invoice"
                        description="Create an invoice NFT"
                        icon={<FiFilePlus className="text-indigo-600" size={28} />}
                        href="/invoices/mint"
                    />

                    <ActionCard
                        title="My Invoices"
                        description="View invoices you own"
                        icon={<FiFileText className="text-blue-600" size={28} />}
                        href="/invoices/mine"
                    />

                    <ActionCard
                        title="Verify Invoice"
                        description="Attestor admin only"
                        icon={<FiShield className="text-green-600" size={28} />}
                        href="/invoices/verify"
                    />

                </div>
            </section>
        </main>
    );
}

/* ACTION CARD COMPONENT */
function ActionCard({ title, description, icon, href }) {
    return (
        <motion.div
            whileHover={{ scale: 1.04, y: -4 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="bg-white/80 backdrop-blur-xl border border-gray-200 shadow-md p-5 rounded-2xl hover:shadow-xl transition-all cursor-pointer"
        >
            <Link href={href} className="space-y-3 block">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gray-100 rounded-xl">{icon}</div>
                    <h3 className="text-xl font-bold">{title}</h3>
                </div>

                <p className="text-sm text-gray-500">{description}</p>

                <div className="flex items-center text-indigo-600 font-semibold mt-2">
                    Go <FiArrowRight className="ml-1" />
                </div>
            </Link>
        </motion.div>
    );
}
