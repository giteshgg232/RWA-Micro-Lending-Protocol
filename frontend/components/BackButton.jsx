"use client";

import { useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";

export default function BackButton({ label = "Back" }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-2 text-gray-600 hover:text-black transition mb-4"
    >
      <FiArrowLeft size={22} />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
    