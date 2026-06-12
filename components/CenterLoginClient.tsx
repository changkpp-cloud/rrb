"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Eye, EyeOff, KeyRound, Mail } from "lucide-react";
import IosPageHeader from "@/components/IosPageHeader";

export default function CenterLoginClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin() {
    if (!email.trim() || !password) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/center/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
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
            <p className="text-xs text-gold-500">บัญชีของคุณถูกสร้างโดยผู้ดูแลระบบ</p>
          </div>

          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-5 space-y-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-gold-700">อีเมล</span>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl gold-border bg-white">
                <Mail className="w-4 h-4 text-gold-400 shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  placeholder="your@email.com"
                  className="flex-1 bg-transparent text-gold-800 placeholder-gold-300 focus:outline-none text-sm"
                  autoComplete="email"
                />
              </div>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-gold-700">รหัสผ่าน</span>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl gold-border bg-white">
                <KeyRound className="w-4 h-4 text-gold-400 shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  placeholder="รหัสผ่าน"
                  className="flex-1 bg-transparent text-gold-800 placeholder-gold-300 focus:outline-none text-sm"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="text-gold-400 hover:text-gold-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>

            {error && <p className="text-xs text-red-500 text-center">{error}</p>}

            <button
              onClick={handleLogin}
              disabled={loading || !email.trim() || !password}
              className="w-full gold-gradient text-white font-semibold py-3.5 rounded-2xl text-base shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <KeyRound className="w-5 h-5" />
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </div>

          <p className="text-center text-[11px] text-gold-400 leading-relaxed">
            หากยังไม่มีบัญชี ติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์เข้าใช้งาน
          </p>

        </div>
      </main>
    </div>
  );
}
