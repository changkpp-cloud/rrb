"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Printer, Loader2 } from "lucide-react";

// ปุ่มสั่งพิมพ์ป้ายซ้ำสำหรับศูนย์ (กรณีเครื่องพิมพ์พลาด/ออฟไลน์)
export default function NameplateActions({ donationId }: { donationId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function reprint() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/donations/${donationId}/nameplate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reprint" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "พิมพ์ซ้ำไม่สำเร็จ");
        setBusy(false);
        return;
      }
      router.refresh();
    } catch {
      setError("เชื่อมต่อไม่สำเร็จ");
    }
    setBusy(false);
  }

  return (
    <div className="mt-2 ml-10 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={reprint}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-full border border-gold-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-gold-700 active:opacity-80 disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
        พิมพ์ซ้ำ
      </button>
      {error && <span className="text-[10px] text-red-600">{error}</span>}
    </div>
  );
}
