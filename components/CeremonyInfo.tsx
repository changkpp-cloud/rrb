import LotusIcon from "./LotusIcon";
import type { Memorial } from "@/lib/supabase/types";
import { parsePrayerDetails } from "@/lib/prayer-details";

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

function formatFull(date: Date) {
  return `วัน${THAI_DAYS[date.getDay()]}ที่ ${date.getDate()} ${THAI_MONTHS[date.getMonth()]} ${date.getFullYear() + 543}`;
}

function formatShortRange(start: Date, end: Date) {
  const sameMonth = start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${start.getDate()}–${end.getDate()} ${THAI_MONTHS[end.getMonth()]} ${end.getFullYear() + 543}`;
  }
  return `${start.getDate()} ${THAI_MONTHS[start.getMonth()]} – ${end.getDate()} ${THAI_MONTHS[end.getMonth()]} ${end.getFullYear() + 543}`;
}

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function CandleIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12 2C12 2 9.5 5 9.5 7.5C9.5 9 10.6 10 12 10C13.4 10 14.5 9 14.5 7.5C14.5 5 12 2 12 2Z" fill="currentColor" opacity="0.85" />
      <rect x="9" y="10" width="6" height="12" rx="1.5" fill="currentColor" opacity="0.6" />
      <rect x="7" y="21" width="10" height="1.5" rx="0.75" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

export default function CeremonyInfo({ memorial }: Props) {
  const cremationDate = parseDate(memorial.ceremony_date);
  const chantStart = addDays(cremationDate, -3);
  const chantEnd   = addDays(cremationDate, -1);
  const prayerDetails = parsePrayerDetails(memorial.prayer_date, memorial.prayer_location);

  const prayerDateText = prayerDetails.schedule
    ? prayerDetails.schedule
    : formatShortRange(chantStart, chantEnd);

  const prayerLocation = prayerDetails.location
    ? prayerDetails.location
    : `${memorial.ceremony_location}${memorial.ceremony_hall ? ` ${memorial.ceremony_hall}` : ""}`;

  const cremationLocation = `${memorial.ceremony_location}${memorial.ceremony_hall ? ` ${memorial.ceremony_hall}` : ""}`;
  const cremationTime = memorial.ceremony_time ? ` เวลา ${memorial.ceremony_time} น.` : "";

  return (
    <section className="px-4 pt-1 pb-3">
      <div className="max-w-lg mx-auto">

        {/* iOS section label */}
        <p
          className="text-gold-500 font-semibold px-1 mb-2"
          style={{ fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase" }}
        >
          กำหนดการ
        </p>

        {/* iOS grouped table */}
        <div className="ios-group">

          {/* Row 1 — สวดพระอภิธรรม */}
          <div className="flex items-start gap-3 px-4 py-3.5">
            <div
              className="ios-icon-badge flex-shrink-0 w-9 h-9 rounded-[10px] flex items-center justify-center mt-0.5"
            >
              <LotusIcon className="w-[18px] h-[18px] text-gold-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gold-800 leading-tight mb-0.5">
                สวดพระอภิธรรม
              </p>
              <p className="text-xs text-gold-600 leading-snug">{prayerDateText}</p>
              <p className="text-[11px] text-gold-400 leading-snug mt-0.5 truncate">ณ {prayerLocation}</p>
            </div>
          </div>

          {/* iOS separator — indented to align with text */}
          <div className="ios-separator" />

          {/* Row 2 — ฌาปนกิจ */}
          <div className="flex items-start gap-3 px-4 py-3.5">
            <div
              className="flex-shrink-0 w-9 h-9 rounded-[10px] flex items-center justify-center mt-0.5"
              style={{
                background: "linear-gradient(135deg, rgba(243,198,168,0.55) 0%, rgba(201,152,60,0.22) 100%)",
                border: "0.5px solid rgba(201,152,60,0.38)",
              }}
            >
              <CandleIcon className="w-[18px] h-[18px] text-gold-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gold-800 leading-tight mb-0.5">
                ฌาปนกิจ
              </p>
              <p className="text-xs text-gold-600 leading-snug">
                {formatFull(cremationDate)}{cremationTime}
              </p>
              <p className="text-[11px] text-gold-400 leading-snug mt-0.5 truncate">ณ {cremationLocation}</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
