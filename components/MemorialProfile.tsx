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
        <div
          className="relative"
          style={{
            width: "52vw",
            maxWidth: 220,
          }}
        >
          <div className="relative">
            {memorial.photo_url ? (
              <Image
                src={memorial.photo_url}
                alt={memorial.name}
                width={440}
                height={640}
                className="h-auto w-full object-contain"
                priority
              />
            ) : (
              <div
                className="aspect-[3/4] w-full flex items-center justify-center"
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
          style={{ fontSize: "clamp(1.05rem, 4.6vw, 1.28rem)", letterSpacing: "-0.01em" }}
        >
          {memorial.name}
        </h2>

        <div className="mt-3 space-y-2 text-center">
          <p className="font-semibold text-gold-700 leading-snug" style={{ fontSize: "clamp(0.88rem, 3.7vw, 1.02rem)" }}>
            <span className="text-gold-400" style={{ fontSize: "clamp(0.78rem, 3.2vw, 0.9rem)" }}>ชาตะ</span>{" "}
            {formatThaiDate(memorial.birth_date)}
          </p>
          <p className="font-semibold text-gold-700 leading-snug" style={{ fontSize: "clamp(0.88rem, 3.7vw, 1.02rem)" }}>
            <span className="text-gold-400" style={{ fontSize: "clamp(0.78rem, 3.2vw, 0.9rem)" }}>มรณะ</span>{" "}
            {formatThaiDate(memorial.death_date)}
          </p>
          <p className="font-semibold text-gold-700 leading-snug" style={{ fontSize: "clamp(0.88rem, 3.7vw, 1.02rem)" }}>
            <span className="text-gold-400" style={{ fontSize: "clamp(0.78rem, 3.2vw, 0.9rem)" }}>อายุ</span>{" "}
            {memorial.age} ปี
          </p>
        </div>
      </div>

    </section>
  );
}
