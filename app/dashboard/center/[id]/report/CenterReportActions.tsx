"use client";

import { Printer, Download } from "lucide-react";

export default function CenterReportActions({ csv, filename }: { csv: string; filename: string }) {
  function downloadCsv() {
    // ﻿ = BOM ให้ Excel อ่านภาษาไทยถูก
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => window.print()}
        className="flex flex-1 items-center justify-center gap-2 rounded-xl gold-gradient px-3 py-2.5 text-sm font-bold text-white shadow-md active:scale-[0.98] transition-all"
      >
        <Printer className="h-4 w-4" />
        พิมพ์ / บันทึก PDF
      </button>
      <button
        type="button"
        onClick={downloadCsv}
        className="flex items-center justify-center gap-2 rounded-xl border border-gold-300 bg-white px-3 py-2.5 text-sm font-semibold text-gold-700 active:opacity-80"
      >
        <Download className="h-4 w-4" />
        CSV
      </button>
    </div>
  );
}
