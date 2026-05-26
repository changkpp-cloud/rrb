"use client";

import Link from "next/link";
import { ArrowLeft, Building2, LogIn } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CenterLoginPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin() {
    if (!code.trim()) { setError("กรุณากรอกรหัสศูนย์"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/center/login?code=${encodeURIComponent(code.trim().toUpperCase())}`);
      const data = await res.json();
      if (!res.ok || !data.id) throw new Error(data.error ?? "ไม่พบรหัสนี้");
      router.push(`/dashboard/center/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ไม่พบรหัสนี้");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "radial-gradient(ellipse 110% 40% at 50% -5%,rgba(245,222,170,0.32) 0%,transparent 100%),linear-gradient(180deg,#FFF8F1 0%,#F7F3EA 35%,#F1E6DC 65%,#F7F3EA 85%,#FFF8F1 100%)" }}>
      <header className="sticky top-0 z-40 bg-cream-100/95 backdrop-blur-sm border-b border-gold-200">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-between">
          <Link href="/dashboard" className="w-8 h-8 rounded-full border border-gold-300 bg-cream-50 flex items-center justify-center text-gold-600 hover:bg-gold-50 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <LotusIcon className="w-5 h-5 text-gold-600" />
            <div className="text-center">
              <p className="text-sm font-bold gold-gradient-text">Dashboard ศูนย์บริหาร</p>
              <p className="text-[9px] text-gold-500 -mt-0.5">Center Access</p>
            </div>
            <LotusIcon className="w-5 h-5 text-gold-600 scale-x-[-1]" />
          </div>
          <div className="w-8" />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-gold-100 border-2 border-gold-300 flex items-center justify-center mx-auto">
              <Building2 className="w-8 h-8 text-gold-600" />
            </div>
            <h2 className="text-xl font-bold text-gold-800">เข้าสู่ระบบศูนย์บริหาร</h2>
            <p className="text-xs text-gold-500 leading-relaxed">
              กรอกรหัสศูนย์บริหารหรีดร่วมบุญของท่าน<br />เพื่อจัดการงานศพและข้อมูลต่างๆ
            </p>
          </div>

          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gold-700">รหัสศูนย์บริหาร</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="เช่น C001PK"
                className="w-full px-4 py-3 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-base font-bold text-center tracking-[0.25em] uppercase"
                maxLength={12}
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
            ยังไม่มีรหัส? ติดต่อทีมงานหรีดร่วมบุญ
          </p>
        </div>
      </main>
    </div>
  );
}
