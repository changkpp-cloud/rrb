"use client";

import { Clock } from "lucide-react";

export default function PendingStatusBanner() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-4">
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
        <div className="shrink-0 mt-0.5 w-7 h-7 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-800">รับสลิปแล้ว รอตรวจสอบ</p>
          <p className="text-xs text-amber-600 leading-relaxed mt-0.5">
            เจ้าหน้าที่ศูนย์กำลังตรวจสอบสลิปของคุณ ป้ายชื่อจะพิมพ์โดยอัตโนมัติเมื่อยืนยันแล้ว
          </p>
        </div>
      </div>
    </div>
  );
}
