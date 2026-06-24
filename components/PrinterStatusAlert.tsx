"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

interface Status {
  hasPrinter: boolean;
  online: boolean | null;
  failed: number;
}

// แบนเนอร์เตือน "ตรวจสอบเครื่องพิมพ์" — แสดงทั้งแดชบอร์ดศูนย์และเจ้าภาพ
// เด้งเมื่อ: เครื่องพิมพ์ออฟไลน์ หรือ มีป้ายพิมพ์ไม่สำเร็จ
export default function PrinterStatusAlert({ memorialId }: { memorialId: string }) {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    let active = true;
    async function check() {
      try {
        const res = await fetch(`/api/printer-status?memorialId=${memorialId}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as Status;
        if (active) setStatus(data);
      } catch {
        /* เงียบไว้ — ไม่รบกวนหน้าจอ */
      }
    }
    check();
    const timer = setInterval(check, 30_000); // เช็กทุก 30 วินาที
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [memorialId]);

  if (!status) return null;
  const offline = status.online === false;
  const hasFailed = status.failed > 0;
  if (!offline && !hasFailed) return null;

  return (
    <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-sm font-bold text-red-700">⚠️ ตรวจสอบเครื่องพิมพ์ที่หน้างาน</p>
        <p className="text-xs text-red-600 mt-0.5 leading-relaxed">
          {offline && "เครื่องพิมพ์ออฟไลน์ — ป้ายที่ส่งแล้วจะค้างในคิว แล้วพิมพ์ต่อเองเมื่อเปิดเครื่อง/ใส่กระดาษกลับมา. "}
          {hasFailed && `มีป้ายพิมพ์ไม่สำเร็จ ${status.failed} รายการ (ศูนย์กด "พิมพ์ซ้ำ" ได้). `}
          กรุณาช่วยกันไปตรวจเครื่องพิมพ์ เพื่อให้ป้ายออกครบและนำไปติดบอร์ด
        </p>
      </div>
    </div>
  );
}
