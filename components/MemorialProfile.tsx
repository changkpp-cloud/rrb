import Image from "next/image";
import LotusIcon from "./LotusIcon";
import MemorialPortraitFrame, { getFrameIndex } from "./MemorialPortraitFrame";
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
  return `${date.getDate()} ${thaiMonths[date.getMonth()]} ${date.getFullYear() + 543}`;
}

export default function MemorialProfile({ memorial }: Props) {
  return (
    <section className="relative pt-5 pb-4">

      {/* Portrait */}
      <div className="flex justify-center mb-5">
        <div
          className="relative"
          style={{
            width: "42vw",
            maxWidth: 176,
            filter: "drop-shadow(0 8px 20px rgba(176,120,32,0.18))",
          }}
        >
          {/* Soft halo */}
          <div
            className="absolute animate-pulse-glow"
            style={{
              inset: "-20px",
              borderRadius: "50%",
              background: "radial-gradient(ellipse, rgba(245,222,170,0.38) 0%, transparent 65%)",
              filter: "blur(22px)",
            }}
          />

          {/* Photo — clipped to oval */}
          <div
            className="relative overflow-hidden"
            style={{ aspectRatio: "3/4", borderRadius: "50%" }}
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
                  background: "linear-gradient(135deg, #FAF4E8 0%, #EDD8B0 55%, #F1E6DC 100%)",
                }}
              >
                <LotusIcon className="w-16 h-16 text-gold-400 opacity-55" />
              </div>
            )}
          </div>

          {/* Flower frame overlay — cycles 1 of 10 per memorial */}
          <MemorialPortraitFrame index={getFrameIndex(memorial.id)} />
        </div>
      </div>

      {/* Name — iOS large title style */}
      <div className="text-center px-6">
        <h2
          className="font-bold text-gold-900 leading-tight mb-2"
          style={{ fontSize: "clamp(1.25rem, 5.5vw, 1.55rem)", letterSpacing: "-0.02em" }}
        >
          {memorial.name}
        </h2>

        <div className="mt-3 flex justify-center px-2">
          <div className="ios-group w-fit max-w-full px-5 py-3.5 space-y-2 text-center">
            <p className="font-semibold text-gold-700 leading-snug" style={{ fontSize: "clamp(1.05rem, 4.5vw, 1.28rem)" }}>
              <span className="text-gold-400" style={{ fontSize: "clamp(0.9rem, 3.6vw, 1.05rem)" }}>ชาตะ</span>{" "}
              {formatThaiDate(memorial.birth_date)}
            </p>
            <p className="font-semibold text-gold-700 leading-snug" style={{ fontSize: "clamp(1.05rem, 4.5vw, 1.28rem)" }}>
              <span className="text-gold-400" style={{ fontSize: "clamp(0.9rem, 3.6vw, 1.05rem)" }}>มรณะ</span>{" "}
              {formatThaiDate(memorial.death_date)}
            </p>
            <p className="font-semibold text-gold-700 leading-snug" style={{ fontSize: "clamp(1.05rem, 4.5vw, 1.28rem)" }}>
              <span className="text-gold-400" style={{ fontSize: "clamp(0.9rem, 3.6vw, 1.05rem)" }}>อายุ</span>{" "}
              {memorial.age} ปี
            </p>
          </div>
        </div>
      </div>

    </section>
  );
}
