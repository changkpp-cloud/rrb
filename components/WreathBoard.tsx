import Image from "next/image";
import LotusIcon from "./LotusIcon";

export default function WreathBoard() {
  return (
    <section className="px-4 my-2">
      <div className="max-w-lg mx-auto">

        {/* Gold ornament header */}
        <div className="flex items-center gap-2 mb-1.5 select-none">
          <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(201,152,60,0.40))" }} />
          <LotusIcon className="w-3 h-3 text-gold-400" />
          <span className="text-gold-400 text-[9px] font-medium tracking-widest uppercase">หรีดร่วมบุญ</span>
          <LotusIcon className="w-3 h-3 text-gold-400 scale-x-[-1]" />
          <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, rgba(201,152,60,0.40))" }} />
        </div>

        {/* Wreath image with celestial frame */}
        <div
          className="overflow-hidden"
          style={{
            borderRadius: "16px",
            border: "1.5px solid rgba(201,152,60,0.55)",
            boxShadow:
              "0 8px 36px rgba(176,120,32,0.18), 0 2px 8px rgba(176,120,32,0.10), inset 0 0 0 3px rgba(255,252,248,0.65), inset 0 0 0 4.5px rgba(201,152,60,0.20)",
            background: "rgba(255,252,248,0.80)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
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

      </div>
    </section>
  );
}
