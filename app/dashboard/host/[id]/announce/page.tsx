"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { ImageDown, Share2 } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";
import type { Donation } from "@/lib/supabase/types";

export default function HostAnnouncePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [donations, setDonations] = useState<Donation[]>([]);
  const [memorialName, setMemorialName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const [donRes, memRes] = await Promise.all([
          fetch(`/api/donations?memorial_id=${id}`),
          fetch(`/api/memorial?id=${id}`),
        ]);
        const donData = await donRes.json();
        const memData = await memRes.json();
        setDonations(
          Array.isArray(donData)
            ? donData.filter((d: Donation) => d.status === "confirmed")
            : []
        );
        if (memData?.name) setMemorialName(memData.name);
      } catch {}
      setLoading(false);
    }
    load();
  }, [id]);

  const ordered = [...donations].reverse();

  async function handleSaveImage() {
    if (!contentRef.current) return;
    setSaving(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(contentRef.current, { pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `รายชื่อพิธีกร-${memorialName || id}.png`;
      a.click();
    } catch {}
    setSaving(false);
  }

  async function handleShare() {
    const url = window.location.href;
    const text = `รายชื่อผู้มอบหรีดร่วมบุญ — ${memorialName}`;
    if (navigator.share) {
      await navigator.share({ title: text, url }).catch(() => {});
    } else {
      // fallback: เปิด LINE แชร์ URL
      window.open(
        `https://line.me/R/msg/text/?${encodeURIComponent(text + "\n" + url)}`,
        "_blank"
      );
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header — ไม่ติดไปในภาพ */}
      <header className="sticky top-0 z-40 bg-cream-100/95 backdrop-blur-sm border-b border-gold-200">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LotusIcon className="w-5 h-5 text-gold-600" />
            <div className="text-center">
              <p className="text-sm font-bold gold-gradient-text">รายชื่อสำหรับพิธีกร</p>
              <p className="text-[9px] text-gold-500 -mt-0.5">Announce List</p>
            </div>
            <LotusIcon className="w-5 h-5 text-gold-600 scale-x-[-1]" />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg gold-border bg-cream-50 text-xs text-gold-700 font-semibold hover:bg-cream-100 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              แชร์
            </button>
            <button
              onClick={handleSaveImage}
              disabled={saving}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg gold-border bg-cream-50 text-xs text-gold-700 font-semibold hover:bg-cream-100 transition-colors disabled:opacity-50"
            >
              <ImageDown className="w-3.5 h-3.5" />
              {saving ? "กำลังบันทึก..." : "บันทึกภาพ"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5">
        {loading ? (
          <div className="text-center py-16 text-gold-400 text-sm">กำลังโหลด...</div>
        ) : (
          /* contentRef ครอบเฉพาะเนื้อหา — ส่วนนี้เท่านั้นที่ถ่ายเป็นภาพ */
          <div ref={contentRef} className="space-y-4 bg-white px-1 py-2">
            {/* Title */}
            <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-4 text-center">
              <p className="text-xs text-gold-500 uppercase tracking-wider mb-1">รายชื่อผู้มอบหรีดร่วมบุญ</p>
              {memorialName && (
                <p className="text-lg font-bold text-gold-800">{memorialName}</p>
              )}
              <p className="text-[10px] text-gold-400 mt-1">
                รวม {ordered.length} ราย · {new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>

            {/* Name list */}
            <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4">
              {ordered.length === 0 ? (
                <p className="text-sm text-gold-400 text-center py-6">ยังไม่มีผู้ร่วมบุญที่ยืนยันแล้ว</p>
              ) : (
                <div className="space-y-0">
                  {ordered.map((d, i) => (
                    <div
                      key={d.id}
                      className={`flex items-baseline gap-3 py-2.5 ${i < ordered.length - 1 ? "border-b border-gold-100" : ""}`}
                    >
                      <span className="text-[11px] font-semibold text-gold-400 w-6 shrink-0">{i + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gold-800 leading-snug">{d.donor_name}</p>
                        {d.donor_title && (
                          <p className="text-[10px] text-gold-600 mt-0.5">{d.donor_title}</p>
                        )}
                        {d.message && (
                          <p className="text-[10px] text-gold-400 italic mt-0.5">&ldquo;{d.message}&rdquo;</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-center text-[10px] text-gold-400 pb-1">
              หรีดร่วมบุญ · สำหรับพิธีกรอ่านขอบคุณผู้ร่วมบุญ
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
