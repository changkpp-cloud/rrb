"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarDays, MapPin, UserRound, Info } from "lucide-react";
import IosPageHeader from "@/components/IosPageHeader";
import type { Memorial } from "@/lib/supabase/types";

interface PaidData {
  memorial_id: string;
  slip_url: string;
  amount: string;
}

function readPaid(slug: string): PaidData | null {
  try {
    const raw = sessionStorage.getItem(`rrb_paid_${slug}`);
    return raw ? (JSON.parse(raw) as PaidData) : null;
  } catch {
    return null;
  }
}

function formatThaiDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

interface Props {
  memorial: Memorial;
  slug: string;
}

export default function OverviewClient({ memorial, slug }: Props) {
  const [paid, setPaid] = useState<PaidData | null>(null);

  useEffect(() => {
    setPaid(readPaid(slug));
    function onDone() { setPaid(readPaid(slug)); }
    window.addEventListener("rrb-payment-done", onDone);
    return () => window.removeEventListener("rrb-payment-done", onDone);
  }, [slug]);

  const printNameHref = paid
    ? `/${slug}/print-name?memorial_id=${paid.memorial_id}&slip_url=${encodeURIComponent(paid.slip_url)}&amount=${paid.amount}`
    : `/${slug}/print-name`;

  const ceremonyDate = formatThaiDate(memorial.ceremony_date);
  const location = [memorial.ceremony_location, memorial.ceremony_hall].filter(Boolean).join(" • ");

  const steps = [
    {
      step: 1,
      label: "ดูข้อมูลผู้วายชนม์",
      desc: "รายละเอียดงาน วันเวลา สถานที่",
      href: `/${slug}`,
      unlocked: true,
    },
    {
      step: 2,
      label: "ชำระเงิน แนบสลิป",
      desc: "โอนเงิน และแนบสลิปตรวจสอบ",
      href: `/${slug}/payment`,
      unlocked: true,
    },
    {
      step: 3,
      label: "กรอกชื่อป้าย",
      desc: "ระบุชื่อและข้อความบนป้ายอาลัย",
      href: printNameHref,
      unlocked: !!paid,
    },
    {
      step: 4,
      label: "E-Card ขอบคุณ",
      desc: "รับ E-Card แสดงความอาลัย",
      href: `/${slug}/ecard`,
      unlocked: !!paid,
    },
  ];

  return (
    <div className="min-h-dvh flex flex-col bg-cream-50">
      <IosPageHeader title="หรีดร่วมบุญ" subtitle="Zero Waste" />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-lg px-4 py-4 space-y-4">

          {/* Memorial info card */}
          <div className="rounded-2xl gold-border card-shadow bg-white overflow-hidden">
            <div className="flex gap-4 p-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-gold-200 bg-gold-50">
                {memorial.photo_url ? (
                  <Image
                    src={memorial.photo_url}
                    alt={memorial.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gold-400">
                    <UserRound className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gold-500">ผู้วายชนม์</p>
                <h1 className="mt-1 text-lg font-bold leading-snug text-gold-900 line-clamp-2">{memorial.name}</h1>
                <div className="mt-2 space-y-1 text-xs text-gold-700">
                  {ceremonyDate && (
                    <p className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0 text-gold-400" />
                      {ceremonyDate}{memorial.ceremony_time ? ` เวลา ${memorial.ceremony_time} น.` : ""}
                    </p>
                  )}
                  {location && (
                    <p className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-gold-400" />
                      <span className="line-clamp-1">{location}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div>
            <p className="mb-2 px-1 text-xs font-bold uppercase tracking-[0.15em] text-gold-500">ขั้นตอนการร่วมบุญ</p>
            <div className="space-y-2">
              {steps.map((s) => (
                <Link
                  key={s.step}
                  href={s.href}
                  className="flex items-center gap-3 rounded-2xl gold-border card-shadow bg-white px-4 py-3.5 transition hover:bg-cream-50"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      s.unlocked
                        ? "bg-gold-700 text-white"
                        : "bg-gold-100 text-gold-400"
                    }`}
                  >
                    {s.step}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-bold ${s.unlocked ? "text-gold-900" : "text-gold-400"}`}>
                      {s.label}
                    </p>
                    <p className={`text-xs leading-5 ${s.unlocked ? "text-gold-600" : "text-gold-300"}`}>
                      {s.desc}
                    </p>
                  </div>
                  <ArrowRight className={`h-4 w-4 shrink-0 ${s.unlocked ? "text-gold-500" : "text-gold-300"}`} />
                </Link>
              ))}
            </div>
          </div>

          {/* Info banner */}
          {!paid && (
            <div className="flex items-start gap-3 rounded-xl border border-gold-200 bg-gold-50 px-4 py-3 text-xs leading-5 text-gold-700">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
              กรุณาแนบสลิปการโอนเงินในขั้นตอน 2 ก่อน จึงจะสามารถกรอกชื่อป้ายและรับ E-Card ได้
            </div>
          )}

          <div className="h-20" />
        </div>
      </main>
    </div>
  );
}
