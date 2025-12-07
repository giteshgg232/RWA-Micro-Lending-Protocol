"use client";

import Link from "next/link";
import { FiGithub, FiTwitter, FiGlobe } from "react-icons/fi";

export default function Footer() {
  return (
    <footer className="mt-16 border-t bg-white">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-6">

        {/* LEFT SECTION: BRAND */}
        <div className="text-center md:text-left">
          <h2 className="text-lg font-semibold">RWA Lending Protocol</h2>
          <p className="text-gray-500 text-sm">
            Empowering invoice-backed DeFi lending.
          </p>
        </div>

        {/* MIDDLE SECTION: NAVIGATION */}
        <div className="flex gap-6 text-sm text-gray-600">
          <Link href="/" className="hover:text-black transition">Dashboard</Link>
          <Link href="/loans/all" className="hover:text-black transition">All Loans</Link>
          <Link href="/loans/request" className="hover:text-black transition">Request Loan</Link>
          <Link href="/loans/fund" className="hover:text-black transition">Fund Loan</Link>
        </div>

        {/* RIGHT SECTION: SOCIAL ICONS */}
        <div className="flex gap-4 text-gray-600 text-xl">
          <a href="https://github.com" target="_blank" className="hover:text-black transition"><FiGithub /></a>
          <a href="https://twitter.com" target="_blank" className="hover:text-black transition"><FiTwitter /></a>
          <a href="#" className="hover:text-black transition"><FiGlobe /></a>
        </div>
      </div>

      {/* COPYRIGHT */}
      <div className="text-center text-gray-500 text-xs py-4 border-t">
        © {new Date().getFullYear()} RWA Lending Protocol — All Rights Reserved.
      </div>
    </footer>
  );
}
