"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  donationId: string;
  action: "confirmed" | "rejected";
  label: string;
  variant?: "danger";
}

export default function VerifyDonationButton({ donationId, action, label, variant }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    try {
      await fetch(`/api/donations/${donationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });
      router.refresh();
    } catch {}
    setLoading(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50 ${
        variant === "danger"
          ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
          : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
      }`}
    >
      {loading ? "..." : label}
    </button>
  );
}
