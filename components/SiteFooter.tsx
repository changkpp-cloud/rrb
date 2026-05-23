import LotusIcon from "./LotusIcon";

export default function SiteFooter() {
  return (
    <footer className="shrink-0 text-center py-3 px-4">
      {/* Ornamental lotus divider */}
      <div className="flex items-center justify-center gap-2 mb-2 select-none">
        <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(201,152,60,0.30))" }} />
        <LotusIcon className="w-3 h-3 text-gold-400 opacity-70" />
        <span className="text-gold-300 text-[8px]">◆</span>
        <LotusIcon className="w-3 h-3 text-gold-400 opacity-70 scale-x-[-1]" />
        <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, rgba(201,152,60,0.30))" }} />
      </div>
      <p className="text-xs font-medium text-gold-400 tracking-wide">
        ร่วมอาลัย · ร่วมทำบุญ · ร่วมลดขยะ
      </p>
    </footer>
  );
}
