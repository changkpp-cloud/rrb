"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Download, Pencil } from "lucide-react";
import LotusIcon from "./LotusIcon";
import HostBankForm from "./HostBankForm";
import type { Memorial, Donation } from "@/lib/supabase/types";

interface Props {
  memorial: Memorial;
  donations: Donation[];
  id: string;
}

function formatThaiDate(isoDate: string): string {
  const months = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
  const d = new Date(isoDate);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

const TABS = [
  { id: "summary", label: "สรุปยอด" },
  { id: "donors",  label: "รายชื่อ" },
  { id: "report",  label: "รายงาน" },
  { id: "bank",    label: "บัญชีรับเงิน" },
];

export default function HostDashboardClient({ memorial, donations, id }: Props) {
  const [activeTab, setActiveTab] = useState("summary");
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const confirmed   = donations.filter(d => d.status === "confirmed");
  const totalAmount = confirmed.reduce((s, d) => s + d.amount, 0);
  const serviceFee  = confirmed.length * 100;
  const netAmount   = Math.max(0, totalAmount - serviceFee);

  // Highlight active tab as user scrolls
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sec = entry.target.getAttribute("data-section");
            if (sec) setActiveTab(sec);
          }
        });
      },
      { threshold: 0.25, rootMargin: "-110px 0px -40% 0px" }
    );
    Object.values(sectionRefs.current).forEach(el => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  function scrollTo(tabId: string) {
    const el = sectionRefs.current[tabId];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveTab(tabId);
  }

  function setRef(tabId: string) {
    return (el: HTMLDivElement | null) => { sectionRefs.current[tabId] = el; };
  }

  return (
    <div className="min-h-screen" style={{ background: "#ffffff" }}>

      {/* ── Sticky header + tabs ── */}
      <header className="sticky top-0 z-40 bg-cream-100/95 backdrop-blur-sm border-b border-gold-200 print:hidden">
        <div className="max-w-lg mx-auto px-4 pt-2 pb-1 flex items-center justify-between">
          <Link href="/dashboard/host" className="w-8 h-8 rounded-full border border-gold-300 bg-cream-50 flex items-center justify-center text-gold-600 hover:bg-gold-50 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <LotusIcon className="w-5 h-5 text-gold-600" />
            <div className="text-center">
              <p className="text-sm font-bold gold-gradient-text">Dashboard เจ้าภาพ</p>
              <p className="text-[9px] text-gold-500 -mt-0.5">Host Dashboard</p>
            </div>
            <LotusIcon className="w-5 h-5 text-gold-600 scale-x-[-1]" />
          </div>
          <Link
            href={`/dashboard/host/${id}/edit?code=${memorial.host_code ?? ""}`}
            className="w-8 h-8 rounded-full border border-gold-300 bg-cream-50 flex items-center justify-center text-gold-600 hover:bg-gold-50 transition-all"
            title="แก้ไขข้อมูลงาน"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Tabs */}
        <div className="max-w-lg mx-auto px-4 pb-2">
          <div className="flex gap-1 bg-gold-50 rounded-xl p-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => scrollTo(tab.id)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-white text-gold-800 shadow-sm"
                    : "text-gold-500 hover:text-gold-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-10">

        {/* ════ Section 1: สรุปยอด ════ */}
        <section
          ref={setRef("summary")}
          data-section="summary"
          className="space-y-4 scroll-mt-28"
        >
          {/* Memorial info */}
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 flex items-start gap-3">
            <div className="w-16 h-20 rounded-xl overflow-hidden border-2 border-gold-300 shrink-0 bg-gold-100 flex items-center justify-center">
              {memorial.photo_url
                ? <img src={memorial.photo_url} alt="" className="w-full h-full object-cover" />
                : <LotusIcon className="w-8 h-8 text-gold-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-gold-800 leading-tight">{memorial.name}</p>
              {memorial.birth_date && memorial.death_date && (
                <p className="text-[10px] text-gold-500 mt-0.5">
                  ชาตะ {formatThaiDate(memorial.birth_date)} · มรณะ {formatThaiDate(memorial.death_date)}
                </p>
              )}
              <p className="text-[11px] text-gold-600 mt-1">ฌาปนกิจ {formatThaiDate(memorial.ceremony_date)}</p>
              <p className="text-[10px] text-gold-500">{[memorial.ceremony_location, memorial.ceremony_hall].filter(Boolean).join(" ")}</p>
              {memorial.host_code && (
                <span className="mt-1.5 inline-block text-[9px] bg-gold-100 text-gold-700 px-2 py-0.5 rounded-full font-semibold">
                  รหัส: {memorial.host_code}
                </span>
              )}
            </div>
          </div>

          {/* Financial summary */}
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-4 space-y-3">
            <p className="text-xs font-bold text-gold-600 uppercase tracking-wider">สรุปยอดเงิน</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xl font-bold text-gold-800">{totalAmount.toLocaleString()}</p>
                <p className="text-[9px] text-gold-500">ยอดรวม (฿)</p>
              </div>
              <div>
                <p className="text-xl font-bold text-red-500">-{serviceFee.toLocaleString()}</p>
                <p className="text-[9px] text-gold-500">ค่าดำเนินการ (฿)</p>
              </div>
              <div>
                <p className="text-xl font-bold text-emerald-700">{netAmount.toLocaleString()}</p>
                <p className="text-[9px] text-gold-500">สุทธิเจ้าภาพ (฿)</p>
              </div>
            </div>
            <div className="pt-1 border-t border-gold-200 flex items-center justify-between text-xs text-gold-600">
              <span><span className="font-semibold">{confirmed.length}</span> รายร่วมบุญ</span>
              <span><span className="font-semibold">{donations.length}</span> รายทั้งหมด</span>
            </div>
          </div>
        </section>

        {/* ── Divider ── */}
        <Divider />

        {/* ════ Section 2: รายชื่อ ════ */}
        <section
          ref={setRef("donors")}
          data-section="donors"
          className="space-y-3 scroll-mt-28"
        >
          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-bold text-gold-700">รายชื่อผู้ร่วมบุญ</p>
            <div className="flex items-center gap-1.5 text-xs text-gold-500">
              <Users className="w-3.5 h-3.5" />
              <span><span className="font-semibold text-gold-700">{confirmed.length}</span> ราย</span>
              <span className="text-gold-300">·</span>
              <span className="font-semibold text-gold-700">{totalAmount.toLocaleString()} ฿</span>
            </div>
          </div>

          {donations.length === 0 ? (
            <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-10 text-center">
              <Users className="w-8 h-8 text-gold-300 mx-auto mb-2" />
              <p className="text-sm text-gold-500">ยังไม่มีผู้ร่วมบุญ</p>
            </div>
          ) : (
            <div className="space-y-2">
              {donations.map((d, i) => (
                <div key={d.id} className="bg-cream-50 rounded-2xl gold-border px-4 py-3 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-gold-100 border border-gold-200 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-gold-600">{donations.length - i}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gold-800 leading-tight">{d.donor_name}</p>
                    {d.donor_title && <p className="text-[10px] text-gold-500">{d.donor_title}</p>}
                    {d.message && <p className="text-[10px] text-gold-400 italic mt-0.5">"{d.message}"</p>}
                    <p className="text-[9px] text-gold-400 mt-0.5">{formatDateTime(d.created_at)}</p>
                  </div>
                  <p className="text-sm font-bold text-gold-700 shrink-0">{d.amount.toLocaleString()} ฿</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Divider ── */}
        <Divider />

        {/* ════ Section 3: รายงาน ════ */}
        <section
          ref={setRef("report")}
          data-section="report"
          className="space-y-4 scroll-mt-28"
        >
          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-bold text-gold-700">รายงาน</p>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg gold-border bg-cream-50 text-xs text-gold-700 font-semibold hover:bg-cream-100 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              พิมพ์รายงาน
            </button>
          </div>

          {/* Report header */}
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-4 text-center">
            <p className="text-xs text-gold-500 uppercase tracking-wider mb-1">สรุปรายชื่อผู้ร่วมบุญ</p>
            <p className="text-base font-bold text-gold-800">{memorial.name}</p>
            <p className="text-[10px] text-gold-400 mt-1">
              พิมพ์วันที่ {new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          {/* Report donor list — oldest first */}
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gold-600 uppercase tracking-wider">รายชื่อ</p>
              <span className="text-xs text-gold-500">{confirmed.length} ราย</span>
            </div>
            <div className="space-y-0">
              {[...confirmed].reverse().map((d, i) => (
                <div key={d.id} className={`flex items-start gap-3 py-2.5 ${i < confirmed.length - 1 ? "border-b border-gold-100" : ""}`}>
                  <span className="text-[11px] font-semibold text-gold-400 w-6 shrink-0 mt-0.5">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gold-800 leading-tight">{d.donor_name}</p>
                    {d.donor_title && <p className="text-[10px] text-gold-500">{d.donor_title}</p>}
                  </div>
                  <p className="text-sm font-bold text-gold-700 shrink-0">{d.amount.toLocaleString()} ฿</p>
                </div>
              ))}
              {confirmed.length === 0 && (
                <p className="text-sm text-gold-400 text-center py-6">ยังไม่มีผู้ร่วมบุญที่ยืนยันแล้ว</p>
              )}
            </div>

            {/* Financial totals */}
            <div className="mt-3 pt-3 border-t border-gold-200 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gold-600">ยอดร่วมบุญรวม</span>
                <span className="font-bold text-gold-800">{totalAmount.toLocaleString()} ฿</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gold-600">ค่าดำเนินการ ({confirmed.length} ราย × 100 ฿)</span>
                <span className="font-bold text-red-500">-{serviceFee.toLocaleString()} ฿</span>
              </div>
              <div className="flex justify-between text-sm pt-1 border-t border-gold-100">
                <span className="font-bold text-gold-700">สุทธิเจ้าภาพรับ</span>
                <span className="font-bold text-emerald-700">{netAmount.toLocaleString()} ฿</span>
              </div>
            </div>
          </div>

          <p className="text-center text-[10px] text-gold-400 pb-2">
            เอกสารนี้ออกโดยระบบหรีดร่วมบุญ · ใช้สำหรับพิธีกรอ่านรายชื่อ
          </p>
        </section>

        {/* ── Divider ── */}
        <Divider />

        {/* ════ Section 4: บัญชีรับเงิน ════ */}
        <section
          ref={setRef("bank")}
          data-section="bank"
          className="scroll-mt-28"
        >
          <p className="text-sm font-bold text-gold-700 px-1 mb-4">ข้อมูลบัญชีเจ้าภาพสำหรับรับเงิน</p>
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4">
            <HostBankForm memorial={memorial} />
          </div>
        </section>

        <div className="h-4" />
      </main>
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 print:hidden">
      <div className="flex-1 h-px bg-gold-200" />
      <span className="text-gold-300 text-xs select-none">❖</span>
      <div className="flex-1 h-px bg-gold-200" />
    </div>
  );
}
