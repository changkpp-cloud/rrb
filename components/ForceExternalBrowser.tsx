"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Copy, Check } from "lucide-react";

/**
 * เปิดลิงก์ในแชท (LINE/Facebook/IG) → เด้งออกไปเปิดในเบราว์เซอร์จริงอัตโนมัติ
 * เพราะ in-app browser ของแอปแชทบล็อก deep link แอปธนาคาร (Android 11+ package visibility)
 *
 * - LINE (iOS/Android): ใช้ param openExternalBrowser=1 ที่ LINE รองรับ
 * - Facebook/IG บน Android: บังคับเปิดด้วย Chrome ผ่าน intent://
 * - Facebook/IG บน iOS: เปิดอัตโนมัติไม่ได้ → แสดงคำแนะนำให้กดเมนูเปิดในเบราว์เซอร์
 */
export default function ForceExternalBrowser() {
  const [showIosHint, setShowIosHint] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || "";
    const isLine = /Line\//i.test(ua);
    const isFbIg = /FBAN|FBAV|FB_IAB|Instagram/i.test(ua);
    if (!isLine && !isFbIg) return;

    const isAndroid = /android/i.test(ua);
    const href = window.location.href;

    if (isLine) {
      const url = new URL(href);
      // กันลูป — ถ้าใส่ param ไปแล้วแต่ยังอยู่ใน LINE แสดงว่าเด้งไม่ได้ ไม่ต้องวนซ้ำ
      if (url.searchParams.get("openExternalBrowser") === "1") return;
      url.searchParams.set("openExternalBrowser", "1");
      window.location.replace(url.toString());
      return;
    }

    // Facebook / Instagram
    if (isAndroid) {
      if (sessionStorage.getItem("rrb_ext_redirect") === "1") return;
      sessionStorage.setItem("rrb_ext_redirect", "1");
      const noScheme = href.replace(/^https?:\/\//, "");
      window.location.href = `intent://${noScheme}#Intent;scheme=https;package=com.android.chrome;end`;
      return;
    }

    // iOS FB/IG — เปิดเองไม่ได้ ต้องให้ผู้ใช้กดเมนู
    setShowIosHint(true);
  }, []);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (!showIosHint) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6" style={{ background: "rgba(14,9,2,0.78)" }}>
      <div className="w-full max-w-xs rounded-3xl bg-cream-50 gold-border card-shadow px-6 py-7 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-gold-300 bg-gold-100">
          <ExternalLink className="h-7 w-7 text-gold-600" />
        </div>
        <p className="text-base font-bold text-gold-800">เปิดในเบราว์เซอร์</p>
        <p className="mt-2 text-xs leading-relaxed text-gold-600">
          เพื่อให้กดเข้าแอปธนาคารได้ กรุณาแตะปุ่มเมนู{" "}
          <span className="font-bold">⋯</span> มุมขวาบน แล้วเลือก{" "}
          <span className="font-bold">“เปิดใน Safari”</span>
        </p>
        <button
          type="button"
          onClick={copyLink}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-gold-300 bg-white px-3 py-2.5 text-xs font-semibold text-gold-700 active:opacity-80"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
          {copied ? "คัดลอกลิงก์แล้ว" : "คัดลอกลิงก์ไปเปิดเอง"}
        </button>
      </div>
    </div>
  );
}
