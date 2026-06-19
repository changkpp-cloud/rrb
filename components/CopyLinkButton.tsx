"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface Props {
  url: string;
  label?: string;
}

export default function CopyLinkButton({ url, label = "คัดลอกลิงก์" }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <button
      onClick={handleCopy}
      className="flex shrink-0 items-center gap-1.5 rounded-xl border border-gold-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gold-700 transition-colors hover:bg-gold-50 active:scale-95"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
      {copied ? "คัดลอกแล้ว" : label}
    </button>
  );
}
