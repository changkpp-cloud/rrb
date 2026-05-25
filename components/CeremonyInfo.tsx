import LotusIcon from "./LotusIcon";
import type { Memorial } from "@/lib/supabase/types";

interface Props {
  memorial: Memorial;
}

const THAI_DAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
  "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
  "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

function parseDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDay(date: Date) {
  return `${THAI_DAYS[date.getDay()]}ที่ ${date.getDate()}`;
}

function formatFull(date: Date) {
  return `วัน${THAI_DAYS[date.getDay()]}ที่ ${date.getDate()} ${THAI_MONTHS[date.getMonth()]} ${date.getFullYear() + 543}`;
}

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/* Candle flame SVG icon */
function CandleIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12 2C12 2 9.5 5 9.5 7.5C9.5 9 10.6 10 12 10C13.4 10 14.5 9 14.5 7.5C14.5 5 12 2 12 2Z" fill="currentColor" opacity="0.85" />
      <rect x="9" y="10" width="6" height="12" rx="1.5" fill="currentColor" opacity="0.6" />
      <rect x="7" y="21" width="10" height="1.5" rx="0.75" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

const glassCard: React.CSSProperties = {
  background: "rgba(255,252,248,0.70)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "1px solid rgba(222,184,110,0.36)",
  boxShadow:
    "0 6px 28px rgba(176,120,32,0.09), 0 1px 4px rgba(176,120,32,0.05), inset 0 1px 0 rgba(255,255,255,0.75)",
  borderRadius: "0.75rem",
};

export default function CeremonyInfo({ memorial }: Props) {
  const cremationDate = parseDate(memorial.ceremony_date);

  const chantStart = addDays(cremationDate, -3);
  const chantEnd   = addDays(cremationDate, -1);

  const sameMonth = chantStart.getMonth() === chantEnd.getMonth();
  const chantRange = sameMonth
    ? `${formatDay(chantStart)}–${chantEnd.getDate()} ${THAI_MONTHS[chantEnd.getMonth()]} ${chantEnd.getFullYear() + 543}`
    : `${formatDay(chantStart)} ${THAI_MONTHS[chantStart.getMonth()]} – ${formatDay(chantEnd)} ${THAI_MONTHS[chantEnd.getMonth()]} ${chantEnd.getFullYear() + 543}`;

  const location = `ณ ${memorial.ceremony_location}${memorial.ceremony_hall ? ` ${memorial.ceremony_hall}` : ""}`;

  return (
    <section className="px-4 mb-1 space-y-2">
      <div className="max-w-lg mx-auto space-y-2">

        {/* กำหนดการสวดพระอภิธรรม */}
        <div style={glassCard} className="p-2.5 flex gap-3 items-start">
          <div
            className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(245,222,170,0.55) 0%, rgba(201,152,60,0.20) 100%)",
              border: "1px solid rgba(201,152,60,0.35)",
            }}
          >
            <LotusIcon className="w-5 h-5 text-gold-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gold-800 text-sm leading-tight">กำหนดการสวดพระอภิธรรม</p>
            <p className="text-gold-700 text-xs leading-snug mt-0.5">
              วัน{chantRange}
            </p>
            <p className="text-gold-600 text-xs leading-snug">{location}</p>
          </div>
        </div>

        {/* กำหนดการฌาปนกิจ */}
        <div style={glassCard} className="p-2.5 flex gap-3 items-start">
          <div
            className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(243,198,168,0.45) 0%, rgba(201,152,60,0.18) 100%)",
              border: "1px solid rgba(201,152,60,0.32)",
            }}
          >
            <CandleIcon className="w-5 h-5 text-gold-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gold-800 text-sm leading-tight">กำหนดการฌาปนกิจ</p>
            <p className="text-gold-700 text-xs leading-snug mt-0.5">
              {formatFull(cremationDate)}
              {memorial.ceremony_time ? ` เวลา ${memorial.ceremony_time} น.` : ""}
            </p>
            <p className="text-gold-600 text-xs leading-snug">{location}</p>
          </div>
        </div>

      </div>
    </section>
  );
}
