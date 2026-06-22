"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Download, ExternalLink } from "lucide-react";

interface Props {
  /** ลิงก์หน้างานสำหรับผู้มอบ (หน้าแรกผู้วายชนม์) */
  publicUrl: string;
  /** ลิงก์ auto-login เข้าแดชบอร์ดเจ้าภาพ */
  hostUrl: string;
  /** slug ใช้ตั้งชื่อไฟล์ QR ที่ดาวน์โหลด */
  slug: string;
}

// ── QR image (lazy-load qrcode) ──────────────────────────────────────────────
function QrImage({ url, filename }: { url: string; filename: string }) {
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    let active = true;
    import("qrcode").then((QRCode) => {
      QRCode.toDataURL(url, {
        width: 240,
        margin: 2,
        color: { dark: "#78350f", light: "#fdf8ee" },
      }).then((d) => { if (active) setDataUrl(d); });
    });
    return () => { active = false; };
  }, [url]);

  if (!dataUrl)
    return (
      <div className="w-[160px] h-[160px] mx-auto rounded-xl bg-cream-100 border border-gold-200 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-gold-400 border-t-transparent animate-spin" />
      </div>
    );

  return (
    <div className="flex flex-col items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dataUrl} alt="QR Code" className="w-[160px] h-[160px] rounded-xl border-2 border-gold-300" />
      <a href={dataUrl} download={filename} className="flex items-center gap-1.5 text-xs text-gold-600 underline">
        <Download className="w-3.5 h-3.5" />
        ดาวน์โหลด QR Code
      </a>
    </div>
  );
}

// ── Main share card ──────────────────────────────────────────────────────────
export default function MemorialShareCard({ publicUrl, hostUrl, slug }: Props) {
  const [tab, setTab] = useState<"public" | "host">("public");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  const isPublic = tab === "public";
  const activeUrl = isPublic ? publicUrl : hostUrl;

  const hostMessage =
    `เรียนเจ้าภาพ\n` +
    `ท่านสามารถเข้าดูแดชบอร์ดงานหรีดร่วมบุญ (ยอดร่วมบุญ · รายชื่อผู้มอบ · ยืนยันบัญชีรับเงิน) ได้ที่ลิงก์นี้:\n` +
    `${hostUrl}\n` +
    `(แตะลิงก์เข้าได้ทันที ไม่ต้องกรอกรหัส — กรุณาเก็บลิงก์นี้เป็นความลับ)`;

  function copy(text: string, setter: (v: boolean) => void) {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  }

  return (
    <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-5 space-y-4">
      {/* Tabs */}
      <div className="flex gap-1.5 p-1 rounded-xl bg-cream-100 border border-gold-200">
        <button
          onClick={() => setTab("public")}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${isPublic ? "gold-gradient text-white shadow-sm" : "text-gold-600"}`}
        >
          หน้างาน (ผู้มอบ)
        </button>
        <button
          onClick={() => setTab("host")}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${!isPublic ? "gold-gradient text-white shadow-sm" : "text-gold-600"}`}
        >
          แดชบอร์ดเจ้าภาพ
        </button>
      </div>

      <div className="text-center">
        <p className="text-xs font-semibold text-gold-600">
          {isPublic ? "QR Code + ลิงก์หน้างาน" : "ลิงก์เข้าแดชบอร์ดเจ้าภาพ"}
        </p>
        <p className="text-[10px] text-gold-400 mt-0.5">
          {isPublic
            ? "ให้ผู้มอบสแกนเพื่อเข้าหน้าผู้วายชนม์และร่วมบุญ"
            : "ส่งให้เจ้าภาพ — แตะแล้วเข้าได้ทันที ไม่ต้องกรอกรหัส"}
        </p>
      </div>

      <QrImage url={activeUrl} filename={`qr-${isPublic ? "" : "host-"}${slug}.png`} />

      <div className="bg-white rounded-xl border border-gold-200 px-3 py-2.5">
        <p className="text-xs text-gold-700 break-all font-mono">{activeUrl}</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => copy(activeUrl, setCopiedUrl)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl gold-border bg-cream-50 text-gold-700 text-xs font-semibold hover:bg-cream-100 transition-colors"
        >
          {copiedUrl ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copiedUrl ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
        </button>
        {isPublic ? (
          <a
            href={activeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl gold-gradient text-white text-xs font-semibold"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            เปิดหน้างาน
          </a>
        ) : (
          <button
            onClick={() => copy(hostMessage, setCopiedMsg)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl gold-gradient text-white text-xs font-semibold"
          >
            {copiedMsg ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedMsg ? "คัดลอกแล้ว" : "คัดลอกข้อความส่งเจ้าภาพ"}
          </button>
        )}
      </div>

      {!isPublic && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
          <p className="text-[10px] text-amber-700 leading-relaxed">
            ⚠️ ลิงก์นี้เข้าแดชบอร์ดเจ้าภาพได้โดยไม่ต้องใช้รหัส — ใครมีลิงก์ก็เข้าได้ กรุณาส่งให้เฉพาะเจ้าภาพและเก็บเป็นความลับ
          </p>
        </div>
      )}
    </div>
  );
}
