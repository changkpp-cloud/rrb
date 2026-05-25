"use client";

import Link from "next/link";
import { ArrowLeft, Save, Landmark } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";
import { useState, useEffect } from "react";

const inputCls = "w-full px-4 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm";

export default function BankPage() {
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "saved" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("/api/memorial")
      .then(r => r.json())
      .then(data => {
        const lines: string[] = (data.bank_name ?? "").split("\n");
        setBankName(lines[lines.length - 1] ?? "");
        setAccountNumber(data.bank_account_number ?? "");
        setAccountName(data.bank_account_name ?? "");
        setStatus("idle");
      })
      .catch(() => setStatus("idle"));
  }, []);

  async function handleSave() {
    setStatus("saving");
    setErrorMsg("");
    try {
      const res = await fetch("/api/memorial", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bank_name: `มูลนิธิหรีดร่วมบุญ ESG Zero Waste\n${bankName}`,
          bank_account_number: accountNumber,
          bank_account_name: accountName,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "บันทึกไม่สำเร็จ");
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "radial-gradient(ellipse 110% 40% at 50% -5%,rgba(245,222,170,0.32) 0%,transparent 100%),linear-gradient(180deg,#FFF8F1 0%,#F7F3EA 35%,#F1E6DC 65%,#F7F3EA 85%,#FFF8F1 100%)" }}
    >
      <header className="sticky top-0 z-40 bg-cream-100/95 backdrop-blur-sm border-b border-gold-200">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-between">
          <Link href="/dashboard" className="w-8 h-8 rounded-full border border-gold-300 bg-cream-50 flex items-center justify-center text-gold-600 hover:bg-gold-50 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <LotusIcon className="w-5 h-5 text-gold-600" />
            <div className="text-center">
              <p className="text-sm font-bold gold-gradient-text tracking-wide">ข้อมูลธนาคาร</p>
              <p className="text-[9px] text-gold-500 tracking-widest uppercase -mt-0.5">Bank Account</p>
            </div>
            <LotusIcon className="w-5 h-5 text-gold-600 scale-x-[-1]" />
          </div>
          <div className="w-8" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-4">

        <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-100 border border-gold-200 flex items-center justify-center shrink-0">
            <Landmark className="w-5 h-5 text-gold-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gold-800">บัญชีรับเงินบุญ</p>
            <p className="text-xs text-gold-500 mt-0.5">แก้ไขข้อมูลบัญชีธนาคารที่แสดงในหน้าชำระเงิน</p>
          </div>
        </div>

        <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 space-y-4">

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gold-700">ธนาคาร</label>
            <input
              type="text"
              value={bankName}
              onChange={e => setBankName(e.target.value)}
              placeholder="เช่น ธนาคารกรุงไทย"
              className={inputCls}
              disabled={status === "loading"}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gold-700">เลขบัญชี</label>
            <input
              type="text"
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value)}
              placeholder="เช่น 123-4-56789-0"
              className={`${inputCls} tracking-wider`}
              disabled={status === "loading"}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gold-700">ชื่อบัญชี</label>
            <input
              type="text"
              value={accountName}
              onChange={e => setAccountName(e.target.value)}
              placeholder="ชื่อเจ้าของบัญชี"
              className={inputCls}
              disabled={status === "loading"}
            />
          </div>

          {status === "error" && (
            <p className="text-xs text-red-500">{errorMsg}</p>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={status === "loading" || status === "saving"}
          className="w-full gold-gradient text-white font-semibold py-4 rounded-2xl text-base shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Save className="w-5 h-5" />
          {status === "saving" ? "กำลังบันทึก..." : status === "saved" ? "บันทึกแล้ว ✓" : "บันทึกข้อมูล"}
        </button>

        <div className="h-2" />
      </main>
    </div>
  );
}
