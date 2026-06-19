import Image from "next/image";

interface Props {
  title: string;
  subtitle?: string;
  backHref?: string; // reserved — back navigation handled by FloatingBackButton (bottom-right)
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


export default function IosPageHeader({ title, subtitle, backHref, rightSlot }: Props) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-center px-4 pt-3 pb-2">

      {/* Dynamic Island pill */}
      <div className="flex items-center gap-2.5 px-5 py-[9px]" style={darkPill}>
        <Image src="/rrb-logo.jpg" alt="RRB" width={60} height={24} className="h-5 w-auto object-contain" />
        <div className="flex items-baseline gap-2">
          <span
            className="text-sm font-bold text-white leading-none"
          >
            {title}
          </span>
          {subtitle && (
            <span
              className="text-sm font-bold text-gold-400 uppercase leading-none"
            >
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
