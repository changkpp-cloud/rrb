"use client";

import { Leaf, MessageCircleHeart, X } from "lucide-react";
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
    id: "sponsor-green-partner",
    kind: "sponsor",
    name: "Green Partner Co.",
    frontNote: "ESG Sponsor",
    backMessage: "สนับสนุนงานอาลัยแบบลดขยะ และเปลี่ยนความระลึกถึงเป็นพื้นที่สีเขียว",
  },
  {
    id: "sponsor-better-earth",
    kind: "sponsor",
    name: "Better Earth Foundation",
    frontNote: "CSR Partner",
    backMessage: "ทุกป้ายเริ่มต้นจากผู้สนับสนุน และจะค่อยๆ ถูกแทนที่ด้วยชื่อผู้ร่วมบุญจริง",
  },
  {
    id: "sponsor-zero-waste",
    kind: "sponsor",
    name: "Zero Waste Network",
    frontNote: "Green Memorial",
    backMessage: "ร่วมดูแลให้งานอาลัยสงบ สมเกียรติ และลดขยะจากพวงหรีดใช้ครั้งเดียว",
  },
  {
    id: "sponsor-community",
    kind: "sponsor",
    name: "Community ESG Fund",
    frontNote: "พื้นที่สนับสนุน",
    backMessage: "ป้ายนี้เป็นพื้นที่เริ่มต้นของบอร์ด และจะถูกแทนที่เมื่อมีผู้ร่วมบุญของงานนี้เพิ่มขึ้น",
  },
];

function toBoardTags(donations: BoardDonation[]) {
  const donorTags: BoardTag[] = donations.map((donation) => ({
    id: donation.id,
    kind: "donor",
    name: donation.donor_name,
    frontNote: donation.donor_title || "ร่วมบุญแทนพวงหรีด",
    backMessage: donation.message?.trim() || "ร่วมส่งความอาลัยและกำลังใจถึงเจ้าภาพ",
  }));

  return [...donorTags, ...sponsorTags].slice(0, 8);
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

  return (
    <section className="px-4 pt-1 pb-2">
      <div className="mx-auto max-w-lg">
        <div className="mb-2 flex items-center justify-between px-1">
          <p
            className="font-semibold text-gold-500"
            style={{ fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase" }}
          >
            บอร์ดหรีดร่วมบุญ
          </p>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-gold-400">
            <MessageCircleHeart className="h-3.5 w-3.5" />
            แตะป้ายเพื่ออ่านข้อความ
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 rounded-2xl border border-gold-300/35 bg-white/65 p-2.5 shadow-sm">
          {boardTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className="group text-left transition active:scale-[0.98]"
            >
              <WreathNameplate tag={tag} compact />
              <span className="mt-1 flex items-center justify-center gap-1 text-[9px] font-semibold text-gold-400 opacity-80">
                {tag.kind === "sponsor" ? <Leaf className="h-3 w-3 text-emerald-600" /> : <LotusIcon className="h-3 w-3" />}
                {tag.kind === "sponsor" ? "ESG Sponsor" : "ผู้ร่วมบุญ"}
              </span>
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
          className="fixed inset-0 z-[70] flex items-center justify-center bg-gold-950/70 px-4 backdrop-blur-sm"
          onClick={() => setSelectedTag(null)}
        >
          <div className="w-full max-w-lg space-y-4" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between px-1">
              <p className="text-sm font-semibold tracking-wide text-white/80">ตัวอย่างป้ายบนบอร์ด</p>
              <button
                type="button"
                onClick={() => setSelectedTag(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white"
                aria-label="ปิด"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <WreathNameplate tag={selectedTag} />

            <div className="rounded-2xl border border-gold-200 bg-cream-50 px-5 py-4 text-center shadow-lg">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-500">ข้อความหลังป้าย</p>
              <p className="mt-2 text-base font-semibold leading-7 text-gold-900">{selectedTag.backMessage}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
