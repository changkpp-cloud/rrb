"use client";

import { KeyRound, LogIn } from "lucide-react";
import IosPageHeader from "@/components/IosPageHeader";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HostLoginPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    setCode("");
  }, []);

  async function handleLogin() {
    if (!code.trim()) { setError("กรุณากรอกรหัสเจ้าภาพ"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/memorial/host?code=${encodeURIComponent(code.trim())}`);
      const data = await res.json();
      if (!res.ok || !data.id) throw new Error(data.error ?? "ไม่พบรหัสนี้");
      router.push(`/dashboard/host/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ไม่พบรหัสนี้");
    }
    setLoading(false);
  }

  return (
    <div
      className="min-h-screen flex flex-col"
    >
      <IosPageHeader title="Dashboard เจ้าภาพ" subtitle="Host Access" backHref="/" />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm space-y-6">

          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-gold-100 border-2 border-gold-300 flex items-center justify-center mx-auto">
              <KeyRound className="w-8 h-8 text-gold-600" />
            </div>
            <h2 className="text-xl font-bold text-gold-800">เข้าสู่ระบบเจ้าภาพ</h2>
            <p className="text-xs text-gold-500 leading-relaxed">
              กรอกรหัสเจ้าภาพที่ได้รับจากศูนย์บริหารหรีดร่วมบุญ<br />เพื่อเข้าดูข้อมูลงานของท่าน
            </p>
          </div>

          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gold-700">รหัสเจ้าภาพ</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                name="rrb-host-token-entry"
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                className="w-full px-4 py-3 rounded-xl gold-border bg-white text-gold-800 focus:outline-none focus:ring-2 focus:ring-gold-400 text-base font-bold text-center tracking-[0.25em]"
                maxLength={10}
              />
            </div>
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
            <button
              onClick={handleLogin}
              disabled={loading || !code.trim()}
              className="w-full gold-gradient text-white font-semibold py-3.5 rounded-2xl text-base shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-5 h-5" />
              {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
            </button>
          </div>

          <p className="text-center text-[11px] text-gold-400">
            ยังไม่มีรหัส? ติดต่อศูนย์บริหารหรีดร่วมบุญในพื้นที่ของท่าน
          </p>
        </div>
      </main>
    </div>
  );
}
