import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LotusIcon from "./LotusIcon";

interface Props {
  title: string;
  subtitle?: string;
  backHref?: string;
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

const darkBtn: React.CSSProperties = {
  background: "rgba(14, 9, 2, 0.75)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "0.5px solid rgba(255,255,255,0.10)",
  boxShadow: "0 2px 12px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.06)",
};

export default function IosPageHeader({ title, subtitle, backHref, rightSlot }: Props) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-center px-4 pt-3 pb-2">

      {/* Back button */}
      {backHref && (
        <Link
          href={backHref}
          className="absolute left-4 flex items-center justify-center w-8 h-8 rounded-full active:scale-90 transition-transform duration-150"
          style={darkBtn}
        >
          <ArrowLeft className="w-4 h-4 text-gold-300" />
        </Link>
      )}

      {/* Dynamic Island pill */}
      <div className="flex items-center gap-2.5 px-5 py-[9px]" style={darkPill}>
        <LotusIcon className="w-[14px] h-[14px] text-gold-300 opacity-90" />
        <div className="flex items-baseline gap-[7px]">
          <span
            className="font-bold text-white leading-none"
            style={{ fontSize: "13px", letterSpacing: "-0.01em" }}
          >
            {title}
          </span>
          {subtitle && (
            <span
              className="text-gold-400 uppercase leading-none"
              style={{ fontSize: "8px", letterSpacing: "0.28em" }}
            >
              {subtitle}
            </span>
          )}
        </div>
        <LotusIcon className="w-[14px] h-[14px] text-gold-300 opacity-90 scale-x-[-1]" />
      </div>

      {/* Right action slot */}
      {rightSlot && (
        <div className="absolute right-4">{rightSlot}</div>
      )}

    </header>
  );
}
