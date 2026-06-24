"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Copy, Check } from "lucide-react";

/**
 * เปิดลิงก์ในแชท (LINE/Facebook/IG) → ไปเปิดในเบราว์เซอร์จริง
 * เพราะ in-app browser ของแอปแชทบล็อก deep link แอปธนาคาร + บันทึกรูปไม่ได้ (Android 11+ package visibility)
 *
 * - LINE (iOS/Android): เด้งออกอัตโนมัติด้วย param openExternalBrowser=1 ที่ LINE รองรับ
 * - Facebook/IG: เด้งเองไม่ได้แบบเงียบ (FB เด้งกล่องยืนยันเอง) → แสดงหน้าจอให้ผู้ใช้กดเปิดเอง
 *     • Android: ปุ่มเปิด Chrome ผ่าน intent://
 *     • iOS: แนะนำให้กดเมนู ⋯ → "เปิดใน Safari"
 */
type Mode = null | "android-fb" | "ios-fb";

export default function ForceExternalBrowser() {
  const [mode, setMode] = useState<Mode>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || "";
    const isLine = /Line\//i.test(ua);
    const isFbIg = /FBAN|FBAV|FB_IAB|Instagram/i.test(ua);
    if (!isLine && !isFbIg) return;

    if (isLine) {
      const url = new URL(window.location.href);
      // กันลูป — ถ้าใส่ param ไปแล้วแต่ยังอยู่ใน LINE แสดงว่าเด้งไม่ได้ ไม่ต้องวนซ้ำ
      if (url.searchParams.get("openExternalBrowser") === "1") return;
      url.searchParams.set("openExternalBrowser", "1");
      window.location.replace(url.toString());
      return;
    }

    // Facebook / Instagram — ให้ผู้ใช้กดเปิดเอง
    setMode(/android/i.test(ua) ? "android-fb" : "ios-fb");
  }, []);

  function openChrome() {
    const noScheme = window.location.href.replace(/^https?:\/\//, "");
    window.location.href = `intent://${noScheme}#Intent;scheme=https;package=com.android.chrome;end`;
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (!mode) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6" style={{ background: "rgba(14,9,2,0.78)" }}>
      <div className="w-full max-w-xs rounded-3xl bg-cream-50 gold-border card-shadow px-6 py-7 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-gold-300 bg-gold-100">
          <ExternalLink className="h-7 w-7 text-gold-600" />
        </div>
        <p className="text-base font-bold text-gold-800">เปิดในเบราว์เซอร์</p>

        {mode === "android-fb" ? (
          <>
            <p className="mt-2 text-xs leading-relaxed text-gold-600">
              เพื่อให้กดเข้าแอปธนาคารและบันทึกรูปได้ กรุณาเปิดหน้านี้ในเบราว์เซอร์ Chrome
            </p>
            <button
              type="button"
              onClick={openChrome}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl gold-gradient px-3 py-3 text-sm font-bold text-white shadow-md active:scale-[0.98] transition-all"
            >
              <ExternalLink className="h-4 w-4" />
              เปิดใน Chrome
            </button>
            <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-left">
              <p className="text-[11px] font-bold text-amber-800">หลังกดปุ่ม เฟซบุ๊กจะถามว่า:</p>
              <p className="mt-1 text-[11px] leading-relaxed text-amber-700">
                “คุณกำลังจะออกจากแอป” → ให้กด{" "}
                <span className="font-bold">“ดำเนินการต่อ”</span> เพื่อไปเบราว์เซอร์
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-amber-600">
                * เป็นการออกจาก “เฟซบุ๊ก” ไป Chrome เท่านั้น ไม่ใช่ออกจากหน้าหรีดร่วมบุญ
              </p>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-xs leading-relaxed text-gold-600">
              เพื่อให้กดเข้าแอปธนาคารและบันทึกรูปได้ กรุณาแตะปุ่มเมนู{" "}
              <span className="font-bold">⋯</span> มุมขวาบน แล้วเลือก{" "}
              <span className="font-bold">“เปิดในเบราว์เซอร์”</span>
            </p>
            <button
              type="button"
              onClick={copyLink}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-gold-300 bg-white px-3 py-2.5 text-xs font-semibold text-gold-700 active:opacity-80"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              {copied ? "คัดลอกลิงก์แล้ว" : "คัดลอกลิงก์ไปเปิดเอง"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
