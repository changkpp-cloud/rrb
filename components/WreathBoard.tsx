import Image from "next/image";
import LotusIcon from "./LotusIcon";

export default function WreathBoard() {
  return (
    <section className="px-4 pt-1 pb-2">
      <div className="max-w-lg mx-auto">

        {/* iOS section label */}
        <p
          className="text-gold-500 font-semibold px-1 mb-2"
          style={{ fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase" }}
        >
          หรีดร่วมบุญ
        </p>

        {/* Wreath image — iOS clean card frame */}
        <div
          className="overflow-hidden"
          style={{
            borderRadius: "16px",
            border: "0.5px solid rgba(201,152,60,0.38)",
            boxShadow:
              "0 4px 32px rgba(176,120,32,0.10), 0 1px 4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.80)",
            background: "rgba(255,252,248,0.82)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <Image
            src="/img/บอร์ด2.png"
            alt="หรีดร่วมบุญ"
            width={1448}
            height={1086}
            style={{ width: "100%", height: "auto", display: "block" }}
            priority
          />
        </div>

        {/* Caption */}
        <div className="flex items-center justify-center gap-1.5 mt-2 opacity-60">
          <LotusIcon className="w-2.5 h-2.5 text-gold-400" />
          <p className="text-[10px] text-gold-400 tracking-widest font-medium" style={{ letterSpacing: "0.2em" }}>
            ESG ZERO WASTE
          </p>
          <LotusIcon className="w-2.5 h-2.5 text-gold-400 scale-x-[-1]" />
        </div>

      </div>
    </section>
  );
}
