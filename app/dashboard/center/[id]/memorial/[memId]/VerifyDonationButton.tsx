"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import Button from "@/components/ui/Button";

interface Props {
  donationId: string;
  action: "confirmed" | "rejected";
  label: string;
  variant?: "danger";
}

export default function VerifyDonationButton({ donationId, action, label, variant }: Props) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/donations/${donationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });
      if (!res.ok) throw new Error("เกิดข้อผิดพลาด");
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        router.refresh();
      }, 1500);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      setTimeout(() => setErrorMsg(""), 2500);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 px-3 py-2 min-h-[40px]">
        <Check className="w-3.5 h-3.5" />
        สำเร็จ
      </span>
    );
  }

  if (errorMsg) {
    return (
      <span className="inline-flex items-center text-[11px] font-semibold text-red-600 px-3 py-2 min-h-[40px]">
        {errorMsg}
      </span>
    );
  }

  return (
    <Button
      size="sm"
      variant={variant === "danger" ? "danger" : "secondary"}
      loading={loading}
      onClick={handleClick}
    >
      {label}
    </Button>
  );
}
