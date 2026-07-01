"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { Check, User, Briefcase, Lock, MessageCircleHeart } from "lucide-react";

export default function SlugPrintNamePage() {
  return (
    <Suspense>
      <PrintNameInner />
    </Suspense>
  );
}

function PrintNameInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { slug } = useParams<{ slug: string }>();
  const amount = params.get("amount") ?? "";
  const memorial_id = params.get("memorial_id") ?? "";
  const slip_url = params.get("slip_url") ?? "";
  const slip_hash = params.get("slip_hash") ?? "";
  const duplicate = params.get("duplicate") ?? "";
  const [name, setName] = useState(params.get("name") ?? "");
  const [title, setTitle] = useState(params.get("title") ?? "");
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);
  const locked = !memorial_id;

  async function handleSend() {
    const trimmedName = name.trim();
    const trimmedTitle = title.trim();
    const trimmedMessage = message.trim();
    setSending(true);

    // Create donation now with the real name (single INSERT, no PATCH needed)
    // status = "pending" — ป้ายจะพิมพ์อัตโนมัติเมื่อศูนย์กดยืนยันสลิป (ไม่ยิงพิมพ์จาก donor flow)
    let donationId = "";
    if (memorial_id) {
      try {
        const body: Record<string, unknown> = {
          memorial_id,
          donor_name: trimmedName,
          amount: parseFloat(amount) || 0,
          slip_url: slip_url || undefined,
          slip_hash: slip_hash || undefined,
          slip_duplicate_warning: duplicate === "true",
        };
        if (trimmedTitle) body.donor_title = trimmedTitle;
        if (trimmedMessage) body.message = trimmedMessage;
        const res = await fetch("/api/donations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          setSending(false);
          setShowModal(false);
          return;
        }
        donationId = data?.donation?.id ?? "";
      } catch {}
    }

    const q = new URLSearchParams({ name: trimmedName, title: trimmedTitle, amount });
    if (donationId) q.set("donation_id", donationId);
    setPrintSuccess(true);
    setTimeout(() => {
      router.push(`/${slug}/success?${q.toString()}`);
    }, 1000);
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-3 space-y-3">
          <SignPreview name={name} title={title} />
          {locked && (
            <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <Lock className="h-4 w-4 shrink-0 text-amber-500" />
              กรุณาแนบสลิปการโอนเงินก่อน จึงจะกรอกชื่อป้ายได้
            </div>
          )}
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3 space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-gold-700">
                <User className="w-4 h-4" />
                <span className="text-sm font-semibold">ชื่อ หรือ องค์กร</span>
              </div>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={locked} className="w-full px-4 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm disabled:opacity-50 disabled:cursor-not-allowed" />
            </div>
            <div className="h-px bg-gold-200/50" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-gold-700">
                <Briefcase className="w-4 h-4" />
                <span className="text-sm font-semibold">ตำแหน่ง หรือ ข้อความแสดงอาลัย</span>
              </div>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} disabled={locked} className="w-full px-4 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm disabled:opacity-50 disabled:cursor-not-allowed" />
            </div>
            <div className="h-px bg-gold-200/50" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-gold-700">
                <MessageCircleHeart className="w-4 h-4" />
                <span className="text-sm font-semibold">ข้อความหลังป้าย</span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={locked}
                maxLength={160}
                rows={3}
                placeholder="ฝากข้อความถึงผู้วายชนม์ หรือให้กำลังใจเจ้าภาพ (ไม่บังคับ)"
                className="w-full resize-none px-4 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-right text-[11px] font-medium text-gold-400">{message.length}/160</p>
            </div>
          </div>
          <button onClick={() => setShowModal(true)} disabled={!name.trim() || locked} className="w-full gold-gradient text-white font-semibold py-3.5 rounded-2xl text-base disabled:opacity-40 shadow-md hover:opacity-90 active:scale-[0.98] transition-all">
            ตรวจดูป้ายก่อนยืนยัน
          </button>
          <div className="h-20" />
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.72)" }} onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg space-y-5" onClick={(e) => e.stopPropagation()}>
            <p className="text-center text-white/80 text-sm tracking-wide">ตัวอย่างป้ายที่จะพิมพ์</p>
            <SignPreview name={name} title={title} />
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} disabled={sending} className="flex-1 py-3.5 rounded-2xl border-2 border-white/40 bg-white/10 text-white font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-40">แก้ไขข้อความ</button>
              <button onClick={handleSend} disabled={sending} className="flex-1 py-3.5 rounded-2xl gold-gradient text-white font-semibold text-sm shadow-md active:scale-[0.98] transition-all disabled:opacity-60">
                {sending ? "กำลังส่งพิมพ์" : "ยืนยันส่งพิมพ์"}
              </button>
            </div>
          </div>
        </div>
      )}
      {printSuccess && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-6 bg-gold-900/25 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-3xl bg-cream-50 gold-border card-shadow px-7 py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50">
              <Check className="h-8 w-8 text-emerald-500" />
            </div>
            <p className="text-lg font-bold text-gold-800">ส่งข้อมูลเรียบร้อย</p>
          </div>
        </div>
      )}
    </div>
  );
}

const BASE_W = 288;
const BASE_H = 80;

function SignPreview({ name, title }: { name: string; title: string }) {
  const displayName = name.trim() || "ชื่อ หรือ องค์กร";
  const displayTitle = title.trim() || "ตำแหน่ง หรือ ข้อความแสดงอาลัย";
  const isNamePlaceholder = !name.trim();
  const isTitlePlaceholder = !title.trim();
  const cardRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLParagraphElement>(null);
  const [cardWidth, setCardWidth] = useState(BASE_W);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setCardWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = cardWidth / BASE_W;

  useEffect(() => {
    const el = nameRef.current;
    if (!el) return;
    const MAX = 26 * scale;
    const avail = cardWidth - 24;
    el.style.fontSize = MAX + "px";
    el.style.width = "max-content";
    const tw = el.getBoundingClientRect().width;
    el.style.width = "";
    if (tw > 0) el.style.fontSize = Math.max(6 * scale, Math.min(MAX, (avail / tw) * MAX)) + "px";
  }, [displayName, cardWidth, scale]);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const MAX = 16 * scale;
    const avail = cardWidth - 68;
    el.style.fontSize = MAX + "px";
    el.style.width = "max-content";
    const tw = el.getBoundingClientRect().width;
    el.style.width = "";
    if (tw > 0) el.style.fontSize = Math.max(5 * scale, Math.min(MAX, (avail / tw) * MAX)) + "px";
  }, [displayTitle, cardWidth, scale]);

  const titleMargin = Math.round(34 * scale);
  const titleBottom = Math.round(5 * scale);

  return (
    <div ref={cardRef} className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: `${BASE_W} / ${BASE_H}`, background: "linear-gradient(135deg,#fdf8ee 0%,#f9f0d8 100%)", border: "1.5px solid #c9a84c", boxShadow: "0 4px 20px rgba(184,134,11,0.18), inset 0 0 0 3px #fdf8ee, inset 0 0 0 4px #c9a84c44" }}>
      <div className="absolute left-3 right-3 flex justify-center" style={{ top: "40%", transform: "translateY(-50%)" }}>
        <p ref={nameRef} className={`font-bold whitespace-nowrap leading-tight text-center ${isNamePlaceholder ? "text-gold-300" : "text-gold-800"}`}>{displayName}</p>
      </div>
      <div className="absolute flex justify-center" style={{ bottom: titleBottom + "px", left: titleMargin + "px", right: titleMargin + "px" }}>
        <p ref={titleRef} className={`whitespace-nowrap leading-tight text-center ${isTitlePlaceholder ? "text-gold-300" : "text-gold-600"}`}>{displayTitle}</p>
      </div>
    </div>
  );
}
