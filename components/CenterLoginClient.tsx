"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Eye, EyeOff, KeyRound, LogIn, Mail, UserRound } from "lucide-react";
import IosPageHeader from "@/components/IosPageHeader";

type LoginMode = "access_code" | "user";

type CenterOption = { id: string; name: string; role: string; routeKey: string };

export default function CenterLoginClient() {
  const [mode, setMode] = useState<LoginMode>("access_code");
  const [code, setCode] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [centers, setCenters] = useState<CenterOption[] | null>(null);
  const router = useRouter();

  async function handleAccessCodeLogin() {
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/center/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "เข้าสู่ระบบไม่สำเร็จ");
      router.push(`/dashboard/center/${data.routeKey}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เข้าสู่ระบบไม่สำเร็จ");
    }
    setLoading(false);
  }

  async function handleUserLogin() {
    if (!identifier.trim() || !password) return;
    setLoading(true);
    setError("");
    setCenters(null);
    try {
      const res = await fetch("/api/center/user-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "เข้าสู่ระบบไม่สำเร็จ");

      if (data.centers) {
        setCenters(data.centers as CenterOption[]);
      } else {
        router.push(`/dashboard/center/${data.routeKey}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "เข้าสู่ระบบไม่สำเร็จ");
    }
    setLoading(false);
  }

  const ROLE_TH: Record<string, string> = {
    super_admin: "ผู้ดูแลระบบ",
    center_manager: "ผู้จัดการศูนย์",
    center_staff: "เจ้าหน้าที่ศูนย์",
    center_viewer: "ผู้ดูรายงาน",
  };

  return (
    <div className="min-h-screen flex flex-col">
      <IosPageHeader title="Dashboard ศูนย์" subtitle="Center Access" backHref="/dashboard" />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm space-y-5">

          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-gold-100 border-2 border-gold-300 flex items-center justify-center mx-auto">
              <KeyRound className="w-8 h-8 text-gold-600" />
            </div>
            <h2 className="text-xl font-bold text-gold-800">เข้าสู่ระบบศูนย์</h2>
          </div>

          {/* ── Mode toggle ── */}
          <div className="flex rounded-2xl gold-border bg-cream-50 overflow-hidden p-1 gap-1">
            <button
              onClick={() => { setMode("access_code"); setError(""); setCenters(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                mode === "access_code"
                  ? "gold-gradient text-white shadow-sm"
                  : "text-gold-500 hover:text-gold-700"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              รหัสศูนย์
            </button>
            <button
              onClick={() => { setMode("user"); setError(""); setCenters(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                mode === "user"
                  ? "gold-gradient text-white shadow-sm"
                  : "text-gold-500 hover:text-gold-700"
              }`}
            >
              <UserRound className="w-3.5 h-3.5" />
              บัญชีผู้ใช้
            </button>
          </div>

          {/* ── Center picker (after multi-center user login) ── */}
          {centers && (
            <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 space-y-3">
              <p className="text-xs font-semibold text-gold-700 text-center">เลือกศูนย์ที่ต้องการเข้าใช้งาน</p>
              {centers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => router.push(`/dashboard/center/${c.routeKey}`)}
                  className="w-full flex items-center gap-3 rounded-xl border border-gold-200 bg-white px-4 py-3 hover:bg-gold-50 transition-colors text-left"
                >
                  <Building2 className="w-5 h-5 text-gold-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gold-800 truncate">{c.name}</p>
                    <p className="text-[10px] text-gold-400">{ROLE_TH[c.role] ?? c.role}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!centers && (
            <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-5 space-y-4">

              {mode === "access_code" ? (
                <>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold text-gold-700">รหัสเข้าระบบศูนย์</span>
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl gold-border bg-white">
                      <KeyRound className="w-4 h-4 text-gold-400 shrink-0" />
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === "Enter" && handleAccessCodeLogin()}
                        placeholder="RRB-XXXXXX"
                        autoComplete="off"
                        spellCheck={false}
                        className="flex-1 bg-transparent text-gold-800 placeholder-gold-300 focus:outline-none text-sm font-mono tracking-widest"
                      />
                    </div>
                  </label>

                  {error && <p className="text-xs text-red-500 text-center">{error}</p>}

                  <button
                    onClick={handleAccessCodeLogin}
                    disabled={loading || !code.trim()}
                    className="w-full gold-gradient text-white font-semibold py-3.5 rounded-2xl text-base shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <LogIn className="w-5 h-5" />
                    {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                  </button>

                  <p className="text-center text-[11px] text-gold-400 leading-relaxed">
                    รหัสเข้าศูนย์ได้รับจากผู้ดูแลระบบ
                  </p>
                </>
              ) : (
                <>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold text-gold-700">อีเมลหรือเบอร์โทร</span>
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl gold-border bg-white">
                      <Mail className="w-4 h-4 text-gold-400 shrink-0" />
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleUserLogin()}
                        placeholder="email@example.com"
                        autoComplete="username"
                        className="flex-1 bg-transparent text-gold-800 placeholder-gold-300 focus:outline-none text-sm"
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
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleUserLogin()}
                        placeholder="รหัสผ่าน"
                        autoComplete="current-password"
                        className="flex-1 bg-transparent text-gold-800 placeholder-gold-300 focus:outline-none text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gold-300 hover:text-gold-500 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </label>

                  {error && <p className="text-xs text-red-500 text-center">{error}</p>}

                  <button
                    onClick={handleUserLogin}
                    disabled={loading || !identifier.trim() || !password}
                    className="w-full gold-gradient text-white font-semibold py-3.5 rounded-2xl text-base shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <LogIn className="w-5 h-5" />
                    {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                  </button>

                  <p className="text-center text-[11px] text-gold-400 leading-relaxed">
                    ยังไม่มีบัญชี?{" "}
                    <a href="/dashboard/center/register" className="text-gold-600 underline underline-offset-2 font-semibold">
                      สมัครใช้งาน
                    </a>
                  </p>
                </>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
