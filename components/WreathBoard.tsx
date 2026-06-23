import Image from "next/image";
import LotusIcon from "./LotusIcon";

const DEFAULT_BOARD_IMAGE = "/img/board-default.webp";

interface Props {
  /** ภาพบอร์ดจากแอดมินกลาง (ถ้าไม่ตั้งใช้ภาพเริ่มต้น) */
  imageUrl?: string | null;
  /** ข้อความใต้ภาพ เช่น ผู้สนับสนุน (ถ้าไม่ตั้งใช้ ESG ZERO WASTE) */
  caption?: string | null;
}

export default function WreathBoard({ imageUrl, caption }: Props = {}) {
  const src = imageUrl || DEFAULT_BOARD_IMAGE;
  const captionText = caption || "ESG ZERO WASTE";
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
            src={src}
            alt="หรีดร่วมบุญ"
            width={1024}
            height={768}
            sizes="(max-width: 640px) 100vw, 512px"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>

        {/* Caption */}
        <div className="flex items-center justify-center gap-1.5 mt-2 opacity-60">
          <LotusIcon className="w-2.5 h-2.5 text-gold-400" />
          <p className="text-[10px] text-gold-400 tracking-widest font-medium" style={{ letterSpacing: "0.2em" }}>
            {captionText}
          </p>
          <LotusIcon className="w-2.5 h-2.5 text-gold-400 scale-x-[-1]" />
        </div>

      </div>
    </section>
  );
}
