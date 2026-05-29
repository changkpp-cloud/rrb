"use client";

import { BarChart3, LogIn } from "lucide-react";
import IosPageHeader from "@/components/IosPageHeader";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin() {
    if (!password.trim()) { setError("กรุณากรอกรหัสผ่าน"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "รหัสผ่านไม่ถูกต้อง");
      router.push("/dashboard/admin/overview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "รหัสผ่านไม่ถูกต้อง");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <IosPageHeader title="ESG Admin" subtitle="ส่วนกลาง" backHref="/dashboard" />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-gold-100 border-2 border-gold-300 flex items-center justify-center mx-auto">
              <BarChart3 className="w-8 h-8 text-gold-600" />
            </div>
            <h2 className="text-xl font-bold text-gold-800">Dashboard ESG แอดมิน</h2>
            <p className="text-xs text-gold-500 leading-relaxed">
              ภาพรวมระบบทั้งหมด · ศูนย์ · งานศพ · ESG · การเงิน
            </p>
          </div>

          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gold-700">รหัสผ่านแอดมิน</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="กรอกรหัสผ่าน"
                className="w-full px-4 py-3 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-base text-center"
                maxLength={32}
              />
            </div>
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
            <button
              onClick={handleLogin}
              disabled={loading || !password.trim()}
              className="w-full gold-gradient text-white font-semibold py-3.5 rounded-2xl text-base shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-5 h-5" />
              {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
            </button>
          </div>

          <p className="text-center text-[11px] text-gold-400">
            สำหรับเจ้าหน้าที่บริษัทหรีดร่วมบุญเท่านั้น
          </p>
        </div>
      </main>
    </div>
  );
}
