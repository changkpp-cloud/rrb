"use client";

interface Props {
  donorPreview?: string | null;
  memorialPhotoUrl?: string | null;
  donorName?: string;
  donorPosition?: string;
  deceasedName?: string;
  donorGenderLabel?: string;
  donorAgeLabel?: string;
}

export default function AiPhotoStandingPreview({
  donorPreview,
  memorialPhotoUrl,
  donorName,
  donorPosition,
  deceasedName,
  donorGenderLabel,
  donorAgeLabel,
}: Props) {
  const plaqueLines = [
    donorName?.trim() || "ผู้มอบหรีดร่วมบุญ",
    donorPosition?.trim(),
  ].filter(Boolean);

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gold-700">ตัวอย่างภาพจำลอง</p>
      {(donorGenderLabel || donorAgeLabel) && (
        <p className="text-[10px] leading-relaxed text-gold-500">
          ระบบจะกำหนดผู้มอบเป็น{donorGenderLabel ? `เพศ${donorGenderLabel}` : ""}
          {donorGenderLabel && donorAgeLabel ? " · " : ""}
          {donorAgeLabel ? `ช่วงอายุ ${donorAgeLabel}` : ""}
        </p>
      )}
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-gold-200 bg-cream-100 shadow-sm">
        {memorialPhotoUrl ? (
          <>
            <img
              src={memorialPhotoUrl}
              alt={deceasedName || ""}
              className="absolute inset-0 h-full w-full object-cover opacity-45 blur-[2px] scale-105"
              crossOrigin={memorialPhotoUrl.startsWith("data:") ? undefined : "anonymous"}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-cream-50/75 via-cream-50/45 to-gold-950/30" />
            <div className="absolute left-1/2 top-7 w-28 -translate-x-1/2 overflow-hidden rounded-xl border-2 border-gold-300 bg-cream-50 p-1 shadow-lg">
              <div className="aspect-[4/5] overflow-hidden rounded-lg bg-white">
                <img
                  src={memorialPhotoUrl}
                  alt={deceasedName || ""}
                  className="h-full w-full object-cover"
                  crossOrigin={memorialPhotoUrl.startsWith("data:") ? undefined : "anonymous"}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#f5dfaa_0%,#fdf8ee_45%,#efe1bf_100%)]" />
        )}

        <div className="absolute left-1/2 top-[34%] h-[34%] w-[34%] -translate-x-1/2">
          <div className="absolute left-1/2 top-0 h-16 w-16 -translate-x-1/2 overflow-hidden rounded-full border-2 border-gold-200 bg-gold-100 shadow-md">
            {donorPreview ? (
              <img
                src={donorPreview}
                alt=""
                className="h-full w-full scale-110 object-cover blur-md"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-gold-100 to-gold-300 blur-sm" />
            )}
          </div>
          <div className="absolute left-1/2 top-12 h-40 w-24 -translate-x-1/2 rounded-t-[42px] bg-neutral-950 shadow-xl" />
          <div className="absolute left-1/2 top-20 h-20 w-32 -translate-x-1/2 rounded-[42px] bg-neutral-950" />
          <div className="absolute left-1/2 top-20 h-24 w-6 -translate-x-[74px] rotate-[18deg] rounded-full bg-neutral-900" />
          <div className="absolute left-1/2 top-20 h-24 w-6 translate-x-[50px] rotate-[-18deg] rounded-full bg-neutral-900" />
        </div>

        <div className="absolute left-1/2 top-[55%] w-[74%] -translate-x-1/2 rounded-lg border-2 border-gold-400 bg-cream-50 px-4 py-3 text-center shadow-xl">
          <div className="pointer-events-none absolute inset-1 rounded-md border border-gold-100" />
          <div className="relative min-h-12">
            {plaqueLines.map((line, index) => (
              <p
                key={`${line}-${index}`}
                className={index === 0 ? "text-sm font-bold leading-snug text-gold-900" : "mt-1 text-[11px] leading-snug text-gold-700"}
              >
                {line}
              </p>
            ))}
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent" />
      </div>
    </div>
  );
}
