"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Printer, CheckCircle2, Loader2 } from "lucide-react";

// ปุ่มจัดการป้ายชื่อสำหรับศูนย์: พิมพ์ซ้ำ / ติดบอร์ดแล้ว
export default function NameplateActions({ donationId, status }: { donationId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"" | "reprint" | "posted">("");
  const [error, setError] = useState("");

  async function act(action: "reprint" | "posted") {
    setBusy(action);
    setError("");
    try {
      const res = await fetch(`/api/donations/${donationId}/nameplate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "ทำรายการไม่สำเร็จ");
        setBusy("");
        return;
      }
      router.refresh();
    } catch {
      setError("เชื่อมต่อไม่สำเร็จ");
    }
    setBusy("");
  }

  const isPosted = status === "posted";

  return (
    <div className="mt-2 ml-10 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => act("reprint")}
        disabled={busy !== ""}
        className="inline-flex items-center gap-1.5 rounded-full border border-gold-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-gold-700 active:opacity-80 disabled:opacity-50"
      >
        {busy === "reprint" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
        พิมพ์ซ้ำ
      </button>

      {!isPosted && (
        <button
          type="button"
          onClick={() => act("posted")}
          disabled={busy !== ""}
          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 active:opacity-80 disabled:opacity-50"
        >
          {busy === "posted" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          ติดบอร์ดแล้ว
        </button>
      )}

      {isPosted && (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5" /> ติดบอร์ดแล้ว
        </span>
      )}

      {error && <span className="text-[10px] text-red-600">{error}</span>}
    </div>
  );
}
