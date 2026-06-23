import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  backHref?: string;       // แสดงเป็นปุ่มกลับด้านซ้ายของ header (ลิงก์ตรง ไม่ใช่ย้อน history)
  backLabel?: string;      // ข้อความบนปุ่มกลับ เช่น "กลับหน้าศูนย์"
  rightSlot?: React.ReactNode;
}

const darkPill: React.CSSProperties = {
  background: "rgba(14, 9, 2, 0.82)",
  backdropFilter: "blur(40px) saturate(220%)",
  WebkitBackdropFilter: "blur(40px) saturate(220%)",
  borderRadius: "999px",
  border: "0.5px solid rgba(255,255,255,0.10)",
  boxShadow:
    "0 4px 28px rgba(0,0,0,0.30), 0 1px 6px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.08)",
};


export default function IosPageHeader({ title, subtitle, backHref, backLabel, rightSlot }: Props) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-center px-4 pt-3 pb-2">

      {/* Back button (left) */}
      {backHref && (
        <Link
          href={backHref}
          title={backLabel ?? "ย้อนกลับ"}
          aria-label={backLabel ?? "ย้อนกลับ"}
          className="absolute left-4 flex items-center gap-1 pl-2 pr-3 py-[7px] active:scale-95 transition-transform"
          style={darkPill}
        >
          <ChevronLeft className="h-4 w-4 text-gold-300" strokeWidth={2.4} />
          {backLabel && <span className="text-xs font-bold text-white leading-none">{backLabel}</span>}
        </Link>
      )}

      {/* Dynamic Island pill */}
      <div className="flex items-center gap-2.5 px-5 py-[9px]" style={darkPill}>
        <Image
          src="/rrb-logo-removebg-preview.png"
          alt="RRB"
          width={60}
          height={24}
          className="h-5 w-auto object-contain"
          unoptimized
        />
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold text-white leading-none">
            {title}
          </span>
          {subtitle && (
            <span className="text-sm font-bold text-gold-400 uppercase leading-none">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Right action slot */}
      {rightSlot && (
        <div className="absolute right-4">{rightSlot}</div>
      )}

    </header>
  );
}
