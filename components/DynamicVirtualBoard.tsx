"use client";

import { MessageCircleHeart, X } from "lucide-react";
import { useMemo, useState } from "react";
import LotusIcon from "./LotusIcon";

type BoardTag = {
  id: string;
  kind: "donor" | "sponsor";
  name: string;
  frontNote: string;
  backMessage: string;
};

export type BoardDonation = {
  id: string;
  donor_name: string;
  donor_title: string | null;
  message: string | null;
};

const sponsorTags: BoardTag[] = [
  {
    id: "sponsor-green-heart",
    kind: "sponsor",
    name: "บริษัทรักโลก จำกัด",
    frontNote: "ผู้สนับสนุนสิ่งแวดล้อม",
    backMessage: "ร่วมสนับสนุนงานอาลัยแบบลดขยะ และเปลี่ยนความระลึกถึงเป็นพื้นที่สีเขียว",
  },
  {
    id: "sponsor-forest-fund",
    kind: "sponsor",
    name: "กองทุนป่าเขียว",
    frontNote: "CSR เพื่อชุมชน",
    backMessage: "ป้ายเริ่มต้นจากผู้สนับสนุน และจะค่อยๆ ถูกแทนที่ด้วยชื่อผู้ร่วมบุญของงานนี้",
  },
  {
    id: "sponsor-zero-waste",
    kind: "sponsor",
    name: "เครือข่ายไร้ขยะ",
    frontNote: "Green Memorial",
    backMessage: "ร่วมดูแลให้งานอาลัยสงบ สมเกียรติ และลดขยะจากพวงหรีดใช้ครั้งเดียว",
  },
  {
    id: "sponsor-better-earth",
    kind: "sponsor",
    name: "มูลนิธิสิ่งแวดล้อมดี",
    frontNote: "พื้นที่สนับสนุน",
    backMessage: "ร่วมสนับสนุนพื้นที่ป้ายเริ่มต้น เพื่อให้บอร์ดงานอาลัยดูสมบูรณ์ตั้งแต่วันแรก",
  },
];

function toBoardTags(donations: BoardDonation[]) {
  const seenNames = new Set<string>();
  const donorTags: BoardTag[] = [];

  for (const donation of donations) {
    const name = donation.donor_name.trim();
    const normalizedName = name.replace(/\s+/g, "").toLowerCase();
    if (!name || seenNames.has(normalizedName)) continue;

    seenNames.add(normalizedName);
    donorTags.push({
      id: donation.id,
      kind: "donor",
      name,
      frontNote: donation.donor_title || "ร่วมบุญแทนพวงหรีด",
      backMessage: donation.message?.trim() || "ร่วมส่งความอาลัยและกำลังใจถึงเจ้าภาพ",
    });
  }

  // ผู้มอบจริงขึ้นก่อน แล้วเติมช่องที่เหลือด้วยป้ายสปอนเซอร์
  // → พอผู้มอบจริงเยอะขึ้น ป้ายสปอนเซอร์จะถูกดันออกเองจนหมด
  const CAP = 8;
  const result: BoardTag[] = donorTags.slice(0, CAP);
  for (const sponsor of sponsorTags) {
    if (result.length >= CAP) break;
    result.push(sponsor);
  }
  return result;
}

function WreathNameplate({ tag, compact = false }: { tag: BoardTag; compact?: boolean }) {
  const isSponsor = tag.kind === "sponsor";

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl bg-[#fdf8ee]"
      style={{
        aspectRatio: "288 / 80",
        border: "1.5px solid #c9a84c",
        boxShadow:
          "0 4px 20px rgba(184,134,11,0.16), inset 0 0 0 3px #fdf8ee, inset 0 0 0 4px #c9a84c44",
      }}
    >
      <div className="absolute left-3 right-3 flex justify-center" style={{ top: "40%", transform: "translateY(-50%)" }}>
        <p
          className={`line-clamp-1 text-center font-bold leading-tight text-gold-800 ${
            compact ? "text-[13px]" : "text-[clamp(18px,5vw,26px)]"
          }`}
        >
          {tag.name}
        </p>
      </div>
      <div className="absolute flex justify-center" style={{ bottom: compact ? "4px" : "5px", left: "34px", right: "34px" }}>
        <p
          className={`line-clamp-1 text-center leading-tight ${
            isSponsor ? "text-emerald-700" : "text-gold-600"
          } ${compact ? "text-[9px] font-semibold" : "text-[clamp(12px,3.4vw,16px)]"}`}
        >
          {tag.frontNote}
        </p>
      </div>
    </div>
  );
}

export default function DynamicVirtualBoard({
  donations = [],
  boardCaption,
}: {
  donations?: BoardDonation[];
  boardImageUrl?: string | null;
  boardCaption?: string | null;
}) {
  const boardTags = useMemo(() => toBoardTags(donations), [donations]);
  const [selectedTag, setSelectedTag] = useState<BoardTag | null>(null);

  function openPreview(tag: BoardTag) {
    setSelectedTag(tag);
  }

  function closePreview() {
    setSelectedTag(null);
  }

  return (
    <section className="px-4 pt-1 pb-2">
      <div className="mx-auto max-w-lg">
        <div className="mb-2 flex items-center justify-between px-1">
          <p
            className="font-semibold text-gold-500"
            style={{ fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase" }}
          >
            ผู้มอบหรีดร่วมบุญ
          </p>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-gold-400">
            <MessageCircleHeart className="h-3.5 w-3.5" />
            แตะป้ายเพื่อดูตัวอย่าง
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 rounded-2xl border border-gold-300/35 bg-white/65 p-2.5 shadow-sm">
          {boardTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => openPreview(tag)}
              className="text-left transition active:scale-[0.98]"
              aria-label={`ดูตัวอย่างป้าย ${tag.name}`}
            >
              <WreathNameplate tag={tag} compact />
            </button>
          ))}
        </div>

        <div className="mt-2 flex items-center justify-center gap-1.5 opacity-60">
          <LotusIcon className="h-2.5 w-2.5 text-gold-400" />
          <p className="text-[10px] font-medium tracking-widest text-gold-400">
            {boardCaption || "ESG ZERO WASTE"}
          </p>
          <LotusIcon className="h-2.5 w-2.5 scale-x-[-1] text-gold-400" />
        </div>
      </div>

      {selectedTag && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-gold-950/75 px-4 backdrop-blur-sm"
          onClick={closePreview}
        >
          <div className="w-full max-w-lg space-y-4" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 px-1">
              <p className="text-sm font-semibold tracking-wide text-white/85">ตัวอย่างป้ายบนบอร์ด</p>
              <button
                type="button"
                onClick={closePreview}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full border border-white bg-white px-4 text-sm font-bold text-gold-900 shadow-lg"
                aria-label="ปิดตัวอย่างป้าย"
              >
                <X className="h-5 w-5" />
                ปิด
              </button>
            </div>

            <div className="space-y-3">
              <WreathNameplate tag={selectedTag} />
              <div className="rounded-2xl border border-gold-200 bg-cream-50 px-5 py-5 text-center shadow-lg">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-500">ข้อความหลังป้าย</p>
                <p className="mt-3 text-base font-semibold leading-7 text-gold-900">{selectedTag.backMessage}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
