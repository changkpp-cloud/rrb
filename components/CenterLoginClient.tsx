"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, KeyRound, LogIn, UserPlus } from "lucide-react";
import IosPageHeader from "@/components/IosPageHeader";

type CenterOption = {
  id: string;
  name: string;
  province: string | null;
  amphoe: string | null;
  status: string;
};

export default function CenterLoginClient({ centers }: { centers: CenterOption[] }) {
  const [mode, setMode] = useState<"login" | "register" | "legacy">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [centerId, setCenterId] = useState(centers[0]?.id ?? "");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin() {
    setLoading(true); setError(""); setMessage("");
    try {
      const res = await fetch("/api/center/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "legacy" ? { code: code.trim() } : { email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.id) throw new Error(data.error ?? "เข้าสู่ระบบไม่สำเร็จ");
      router.push(`/dashboard/center/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เข้าสู่ระบบไม่สำเร็จ");
    }
    setLoading(false);
  }

  async function handleRegister() {
    setLoading(true); setError(""); setMessage("");
    try {
      const res = await fetch("/api/center/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ center_id: centerId, email, password, display_name: displayName, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "ส่งคำขอไม่สำเร็จ");
      setMessage("ส่งคำขอสมัครแล้ว รอแอดมินกลางอนุมัติ");
      setMode("login");
    } catch (e) {
      setError(e instanceof Error ? e.message : "ส่งคำขอไม่สำเร็จ");
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
            <p className="text-xs text-gold-500 leading-relaxed">
              ใช้บัญชีรายบุคคลเพื่อแยกสิทธิ์และบันทึกว่าใครเป็นผู้ดำเนินการ
            </p>
          </div>

          <div className="grid grid-cols-3 gap-1 rounded-2xl bg-cream-50 p-1 gold-border">
            <TabButton active={mode === "login"} onClick={() => setMode("login")}>เข้าสู่ระบบ</TabButton>
            <TabButton active={mode === "register"} onClick={() => setMode("register")}>สมัคร</TabButton>
            <TabButton active={mode === "legacy"} onClick={() => setMode("legacy")}>รหัสเดิม</TabButton>
          </div>

          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-5 space-y-4">
            {mode === "legacy" ? (
              <Field label="รหัสศูนย์บริหาร">
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="เช่น C001PK"
                  className="w-full px-4 py-3 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-base font-bold text-center tracking-[0.25em] uppercase"
                  maxLength={12}
                />
              </Field>
            ) : (
              <>
                {mode === "register" && (
                  <>
                    <Field label="ศูนย์ที่ต้องการสมัคร">
                      <select value={centerId} onChange={e => setCenterId(e.target.value)} className="w-full px-3 py-3 rounded-xl gold-border bg-white text-gold-800 text-sm">
                        {centers.map(center => (
                          <option key={center.id} value={center.id}>
                            {center.name}{center.province ? ` · ${center.province}` : ""}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="ชื่อผู้ใช้งาน">
                      <input value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full px-4 py-3 rounded-xl gold-border bg-white text-gold-800 text-sm" />
                    </Field>
                    <Field label="เบอร์โทร">
                      <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-3 rounded-xl gold-border bg-white text-gold-800 text-sm" />
                    </Field>
                  </>
                )}
                <Field label="อีเมล">
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl gold-border bg-white text-gold-800 text-sm" />
                </Field>
                <Field label="รหัสผ่าน">
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl gold-border bg-white text-gold-800 text-sm" />
                </Field>
              </>
            )}

            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
            {message && <p className="text-xs text-emerald-600 text-center">{message}</p>}

            <button
              onClick={mode === "register" ? handleRegister : handleLogin}
              disabled={loading}
              className="w-full gold-gradient text-white font-semibold py-3.5 rounded-2xl text-base shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {mode === "register" ? <UserPlus className="w-5 h-5" /> : mode === "legacy" ? <KeyRound className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
              {loading ? "กำลังดำเนินการ..." : mode === "register" ? "ส่งคำขอสมัคร" : "เข้าสู่ระบบ"}
            </button>
          </div>

          <p className="text-center text-[11px] text-gold-400">
            Social Login เช่น LINE/Facebook/Google ต้องตั้งค่า OAuth provider ใน Supabase ก่อนเปิดใช้งานจริง
          </p>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-gold-700">{label}</span>
      {children}
    </label>
  );
}

function TabButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl py-2 text-[11px] font-semibold transition-all ${active ? "bg-white text-gold-800 shadow-sm" : "text-gold-500"}`}
    >
      {children}
    </button>
  );
}
