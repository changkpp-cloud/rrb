"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

export default function PendingStatusBanner() {
  const [hidden, setHidden] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    // แสดง 5 วินาที แล้วค่อยๆ จางหายไป
    const fade = setTimeout(() => setHidden(true), 5000);
    const remove = setTimeout(() => setGone(true), 5500);
    return () => {
      clearTimeout(fade);
      clearTimeout(remove);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      className={`max-w-lg mx-auto px-4 pt-4 transition-opacity duration-500 ${hidden ? "opacity-0" : "opacity-100"}`}
    >
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
        <div className="shrink-0 mt-0.5 w-7 h-7 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-800">รับการร่วมบุญเรียบร้อย</p>
          <p className="text-xs text-emerald-600 leading-relaxed mt-0.5">
            ระบบบันทึกข้อมูลและส่งพิมพ์ป้ายชื่อให้อัตโนมัติแล้ว ขอบคุณที่ร่วมบุญ
          </p>
        </div>
      </div>
    </div>
  );
}
