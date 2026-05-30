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
  return `${date.getDate()} ${thaiMonths[date.getMonth()]} ${date.getFullYear() + 543}`;
}

export default function MemorialProfile({ memorial }: Props) {
  return (
    <section className="relative pt-5 pb-4">

      {/* Portrait */}
      <div className="flex justify-center mb-5">
        <div className="relative" style={{ width: "42vw", maxWidth: 176 }}>
          {/* Soft halo */}
          <div
            className="absolute animate-pulse-glow"
            style={{
              inset: "-18px",
              borderRadius: "50%",
              background: "radial-gradient(ellipse, rgba(245,222,170,0.42) 0%, transparent 65%)",
              filter: "blur(20px)",
            }}
          />

          {/* Photo */}
          <div
            className="relative overflow-hidden"
            style={{
              aspectRatio: "1",
              borderRadius: "50%",
              border: "2.5px solid rgba(201,152,60,0.70)",
              boxShadow:
                "0 12px 40px rgba(176,120,32,0.20), 0 0 0 5px rgba(255,252,248,0.50), 0 0 0 6.5px rgba(201,152,60,0.14)",
            }}
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

        <div className="max-w-lg mx-auto mt-3 text-left">
          <div className="ios-group">
            <div className="px-4 py-3">
              <p className="text-[11px] font-semibold text-gold-400 leading-tight mb-0.5">
                ชาตะ
              </p>
              <p className="text-sm font-medium text-gold-700 leading-snug">
                {formatThaiDate(memorial.birth_date)}
              </p>
            </div>

            <div className="ios-separator !ml-4" />

            <div className="px-4 py-3">
              <p className="text-[11px] font-semibold text-gold-400 leading-tight mb-0.5">
                มรณะ
              </p>
              <p className="text-sm font-medium text-gold-700 leading-snug">
                {formatThaiDate(memorial.death_date)}
              </p>
            </div>

            <div className="ios-separator !ml-4" />

            <div className="px-4 py-3">
              <p className="text-[11px] font-semibold text-gold-400 leading-tight mb-0.5">
                อายุ
              </p>
              <p className="text-sm font-medium text-gold-700 leading-snug">
                {memorial.age} ปี
              </p>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
