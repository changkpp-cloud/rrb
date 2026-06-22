"use client";

import { useState } from "react";
import { Copy, RefreshCw, Eye, EyeOff, Check } from "lucide-react";

export default function CenterAccessCodePanel({
  centerId,
  initialCode,
}: {
  centerId: string;
  initialCode: string | null;
}) {
  const [code, setCode] = useState(initialCode ?? "—");
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleReset() {
    if (!confirm("รีเซ็ตรหัสเข้าระบบศูนย์? รหัสเดิมจะใช้ไม่ได้ทันที")) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/centers/${centerId}/reset-access-code`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "เกิดข้อผิดพลาด");
      setCode(json.access_code);
      setVisible(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (code === "—") return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const displayCode = visible ? code : code !== "—" ? "•".repeat(code.length) : "—";

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 space-y-2">
      <p className="text-[11px] font-semibold text-amber-700">รหัสเข้าระบบศูนย์</p>
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono font-bold text-amber-800 tracking-widest flex-1">
          {displayCode}
        </span>
        <button
          onClick={() => setVisible(v => !v)}
          className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-600 transition-colors"
          title={visible ? "ซ่อนรหัส" : "แสดงรหัส"}
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
        <button
          onClick={handleCopy}
          disabled={code === "—"}
          className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-600 transition-colors disabled:opacity-40"
          title="คัดลอกรหัส"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
        </button>
        <button
          onClick={handleReset}
          disabled={loading}
          className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          {loading ? "กำลังรีเซ็ต..." : "รีเซ็ตรหัส"}
        </button>
      </div>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
      <p className="text-[10px] text-amber-600">ใช้รหัสนี้ login ที่ /dashboard/center — รีเซ็ตจะทำให้รหัสเดิมใช้ไม่ได้ทันที</p>
    </div>
  );
}
