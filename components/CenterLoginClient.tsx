"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, KeyRound } from "lucide-react";
import IosPageHeader from "@/components/IosPageHeader";

export default function CenterLoginClient() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin() {
    if (!code.trim()) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/center/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.id) throw new Error(data.error ?? "เข้าสู่ระบบไม่สำเร็จ");
      router.push(`/dashboard/center/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เข้าสู่ระบบไม่สำเร็จ");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <IosPageHeader title="Dashboard ศูนย์" subtitle="Center Access" backHref="/dashboard" />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm space-y-5">

          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-gold-100 border-2 border-gold-300 flex items-center justify-center mx-auto">
              <Building2 className="w-8 h-8 text-gold-600" />
            </div>
            <h2 className="text-xl font-bold text-gold-800">เข้าสู่ระบบศูนย์บริหาร</h2>
          </div>

          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-5 space-y-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-gold-700">รหัสศูนย์บริหาร</span>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="เช่น RRB-05620601"
                className="w-full px-4 py-3 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-base font-bold text-center tracking-[0.2em] uppercase"
                maxLength={20}
                autoComplete="off"
              />
            </label>

            {error && <p className="text-xs text-red-500 text-center">{error}</p>}

            <button
              onClick={handleLogin}
              disabled={loading || !code.trim()}
              className="w-full gold-gradient text-white font-semibold py-3.5 rounded-2xl text-base shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <KeyRound className="w-5 h-5" />
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
