import Image from "next/image";
import LotusIcon from "./LotusIcon";
import type { Memorial } from "@/lib/supabase/types";

interface Props {
  memorial: Memorial;
}

function formatThaiDate(dateStr: string) {
  const date = new Date(dateStr);
  const thaiMonths = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
    "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
    "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ];
  const buddhistYear = date.getFullYear() + 543;
  return `${date.getDate()} ${thaiMonths[date.getMonth()]} ${buddhistYear}`;
}

export default function MemorialProfile({ memorial }: Props) {
  return (
    <section className="relative pt-4 pb-2">

      {/* Portrait frame */}
      <div className="flex justify-center mb-3 px-3">
        <div className="relative w-[82vw] max-w-xs aspect-square">

          {/* Outer celestial halo — pulsing glow ring */}
          <div
            className="absolute animate-pulse-glow"
            style={{
              inset: "-10px",
              borderRadius: "50%",
              background: "radial-gradient(ellipse, rgba(245,222,170,0.48) 0%, rgba(232,200,140,0.22) 45%, transparent 68%)",
              filter: "blur(12px)",
            }}
          />

          {/* Second ring — champagne gold shimmer */}
          <div
            className="absolute"
            style={{
              inset: "-3px",
              borderRadius: "50%",
              border: "1px solid rgba(201,152,60,0.28)",
              boxShadow: "0 0 18px rgba(201,152,60,0.22)",
            }}
          />

          {/* Main gold border ring — overlaid on top of photo */}
          <div
            className="absolute"
            style={{
              inset: 0,
              borderRadius: "50%",
              border: "2px solid rgba(201,152,60,0.72)",
              boxShadow:
                "0 0 24px rgba(201,152,60,0.30), 0 4px 32px rgba(176,120,32,0.20), inset 0 0 0 3px rgba(255,252,248,0.60), inset 0 0 0 5px rgba(201,152,60,0.16)",
              zIndex: 2,
            }}
          />

          {/* Photo clip — sits inside the border */}
          <div
            className="absolute overflow-hidden"
            style={{ inset: "2px", borderRadius: "50%", zIndex: 1 }}
          >
            {memorial.photo_url ? (
              <Image
                src={memorial.photo_url}
                alt={memorial.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #F7F3EA 0%, #EDD8B0 50%, #F1E6DC 100%)",
                }}
              >
                {/* Placeholder lotus portrait */}
                <LotusIcon className="w-20 h-20 text-gold-400 opacity-60" />
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Celestial lotus divider */}
      <div className="flex items-center justify-center gap-2 mb-2 select-none px-8">
        <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(201,152,60,0.45))" }} />
        <LotusIcon className="w-3.5 h-3.5 text-gold-400" />
        <span className="text-gold-400 text-[10px]">✦</span>
        <span className="text-gold-300 text-[8px]">◆</span>
        <span className="text-gold-400 text-[10px]">✦</span>
        <LotusIcon className="w-3.5 h-3.5 text-gold-400 scale-x-[-1]" />
        <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, rgba(201,152,60,0.45))" }} />
      </div>

      {/* Name & dates — glassmorphism backing */}
      <div className="px-4">
        <div className="max-w-lg mx-auto">
          <div
            className="text-center px-5 py-3 rounded-xl"
            style={{
              background: "rgba(255,252,248,0.70)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              border: "1px solid rgba(222,184,110,0.36)",
              boxShadow: "0 6px 28px rgba(176,120,32,0.09), 0 1px 4px rgba(176,120,32,0.05), inset 0 1px 0 rgba(255,255,255,0.75)",
            }}
          >
            <h2 className="text-xl font-bold text-gold-800 leading-snug">
              {memorial.name}
            </h2>
            <div className="mt-1.5 space-y-0.5">
              <p className="text-xs text-gold-600">
                <span className="font-semibold text-gold-700">ชาตะ</span>{" "}
                {formatThaiDate(memorial.birth_date)}
              </p>
              <p className="text-xs text-gold-600">
                <span className="font-semibold text-gold-700">มรณะ</span>{" "}
                {formatThaiDate(memorial.death_date)}
              </p>
            </div>
            <p className="text-xs text-gold-500 mt-0.5">อายุ {memorial.age} ปี</p>
          </div>
        </div>
      </div>

      {/* Bottom diamond ornament */}
      <div className="flex justify-center mt-2">
        <span className="text-gold-400 text-sm rotate-45 inline-block">◆</span>
      </div>

    </section>
  );
}
