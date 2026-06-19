"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Users, Download, ExternalLink, Pencil, Banknote, FileText, Camera } from "lucide-react";
import IosPageHeader from "./IosPageHeader";
import LotusIcon from "./LotusIcon";
import HostBankForm from "./HostBankForm";
import MemorialPersonManager from "./host/MemorialPersonManager";
import type { Memorial, Donation } from "@/lib/supabase/types";

interface Props {
  memorial: Memorial;
  donations: Donation[];
  id: string;
}

type TabId = "summary" | "donors" | "report" | "bank" | "persons";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "summary", label: "สรุปยอด",     icon: Banknote },
  { id: "donors",  label: "รายชื่อ",      icon: Users },
  { id: "report",  label: "รายงาน",       icon: FileText },
  { id: "bank",    label: "บัญชีรับเงิน", icon: Banknote },
  { id: "persons", label: "ภาพจำลอง",     icon: Camera },
];

function formatThaiDate(isoDate: string): string {
  const months = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
  const d = new Date(isoDate);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function HostDashboardClient({ memorial, donations, id }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("summary");

  const confirmed    = donations.filter(d => d.status === "confirmed");
  const totalAmount  = confirmed.reduce((s, d) => s + d.amount, 0);
  const serviceFee   = confirmed.length * 100;
  const netAmount    = Math.max(0, totalAmount - serviceFee);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const printErrors  = confirmed.filter(d => (d.nameplate_status as any) === "error");
  const slipWarnings = donations.filter(d => d.slip_duplicate_warning);

  return (
    <div className="min-h-screen">

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-40 print:hidden">
        <IosPageHeader
          title={memorial.name}
          subtitle="Host Dashboard"
          backHref="/dashboard/host"
          rightSlot={
            <Link
              href={`/dashboard/host/${id}/edit?code=${memorial.host_code ?? ""}`}
              className="flex items-center justify-center w-8 h-8 rounded-full active:scale-90 transition-transform"
              style={{ background: "rgba(14,9,2,0.75)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "0.5px solid rgba(255,255,255,0.10)", boxShadow: "0 2px 12px rgba(0,0,0,0.24)" }}
              title="แก้ไขข้อมูลงาน"
            >
              <Pencil className="w-3.5 h-3.5 text-gold-300" />
            </Link>
          }
        />

        {/* Tab bar */}
        <div className="max-w-lg mx-auto px-3 pb-2">
          <div className="flex overflow-x-auto gap-1 bg-gold-50 rounded-xl p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-none flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 whitespace-nowrap ${
                    active ? "bg-white text-gold-800 shadow-sm" : "text-gold-500 hover:text-gold-700"
                  }`}
                >
                  <Icon className="w-3 h-3 shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 py-5">

        {/* ════ สรุปยอด ════ */}
        {activeTab === "summary" && (
          <div className="space-y-4">
            {/* Memorial info card */}
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

            <Link
              href={`/dashboard/host/${id}/edit?code=${memorial.host_code ?? ""}`}
              className="flex items-center justify-center gap-2 rounded-2xl border border-gold-300 bg-gold-50 px-4 py-3 text-sm font-semibold text-gold-800 transition-colors hover:bg-gold-100"
            >
              <Pencil className="h-4 w-4" />
              แก้ไขวัด / วันเวลา / กำหนดการสวด
            </Link>

            {/* Alerts */}
            {printErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 space-y-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-sm font-semibold text-red-700">ส่งพิมพ์ป้ายไม่สำเร็จ {printErrors.length} รายการ</p>
                </div>
                <p className="text-[11px] text-red-600 leading-relaxed pl-6">กรุณาแจ้งเจ้าหน้าที่ศูนย์เพื่อพิมพ์ป้ายซ้ำ</p>
                {printErrors.map(d => (
                  <p key={d.id} className="text-xs font-semibold text-red-700 pl-6">· {d.donor_name}{d.donor_title ? ` — ${d.donor_title}` : ""}</p>
                ))}
              </div>
            )}

            {slipWarnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">พบสลิปซ้ำ {slipWarnings.length} รายการ</p>
                    <p className="text-[11px] text-amber-700 leading-relaxed">ระบบปล่อยให้กรอกชื่อและพิมพ์ป้ายแล้ว รายการนี้เป็นเพียงแจ้งเตือนให้เจ้าภาพและศูนย์รับทราบร่วมกัน</p>
                  </div>
                </div>
                {slipWarnings.slice(0, 5).map(d => (
                  <p key={d.id} className="text-xs font-semibold text-amber-800 pl-6">• {d.donor_name} · {d.amount.toLocaleString()} บาท</p>
                ))}
                {slipWarnings.length > 5 && <p className="text-[11px] text-amber-700 pl-6">และอีก {slipWarnings.length - 5} รายการ</p>}
              </div>
            )}

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
          </div>
        )}

        {/* ════ รายชื่อ ════ */}
        {activeTab === "donors" && (
          <div className="space-y-3">
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
                      {d.slip_duplicate_warning && (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-semibold text-amber-700">
                          <AlertTriangle className="h-3 w-3" />
                          สลิปซ้ำ รับทราบร่วมกัน
                        </span>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-gold-700">{d.amount.toLocaleString()} ฿</p>
                      {d.slip_url && (
                        <a href={`/api/donations/${d.id}/slip`} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-[10px] text-blue-500 underline">
                          <ExternalLink className="h-3 w-3" />
                          ดูสลิป
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════ รายงาน ════ */}
        {activeTab === "report" && (
          <div className="space-y-4">
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

            <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-4 text-center">
              <p className="text-xs text-gold-500 uppercase tracking-wider mb-1">สรุปรายชื่อผู้ร่วมบุญ</p>
              <p className="text-base font-bold text-gold-800">{memorial.name}</p>
              <p className="text-[10px] text-gold-400 mt-1">
                พิมพ์วันที่ {new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>

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
          </div>
        )}

        {/* ════ บัญชีรับเงิน ════ */}
        {activeTab === "bank" && (
          <div className="space-y-3">
            <p className="text-sm font-bold text-gold-700 px-1">ข้อมูลบัญชีเจ้าภาพสำหรับรับเงิน</p>
            <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4">
              <HostBankForm memorial={memorial} />
            </div>
          </div>
        )}

        {/* ════ ภาพจำลอง ════ */}
        {activeTab === "persons" && (
          <div className="space-y-3">
            <div className="px-1">
              <p className="text-sm font-bold text-gold-700">บุคคลสำหรับภาพจำลอง AI</p>
              <p className="text-[11px] text-gold-500 mt-0.5">จัดการรูปภาพบุคคลที่จะปรากฏในภาพจำลองสำหรับผู้ร่วมบุญ</p>
            </div>
            <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4">
              <MemorialPersonManager memorialId={memorial.id} />
            </div>
          </div>
        )}

        <div className="h-4" />
      </main>
    </div>
  );
}
