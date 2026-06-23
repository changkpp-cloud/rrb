import { getSiteSettings, HOME_BOARD_IMAGE_KEY, HOME_BOARD_CAPTION_KEY } from "@/lib/site-settings";

/** แบนเนอร์ "ตัวอย่างบอร์ดหรีดร่วมบุญ" (ผู้สนับสนุนโครงการ) — แอดมินกลางตั้งค่า */
export default async function HomeBoardBanner() {
  const settings = await getSiteSettings([HOME_BOARD_IMAGE_KEY, HOME_BOARD_CAPTION_KEY]);
  const imageUrl = settings[HOME_BOARD_IMAGE_KEY];
  const caption = settings[HOME_BOARD_CAPTION_KEY];

  if (!imageUrl) return null;

  return (
    <section className="px-4 mt-4">
      <div className="max-w-md mx-auto">
        <p className="text-[10px] font-semibold text-gold-500 text-center uppercase tracking-wider mb-2">
          ตัวอย่างบอร์ดหรีดร่วมบุญ
        </p>
        <div className="rounded-2xl overflow-hidden border border-gold-200 card-shadow bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="ตัวอย่างบอร์ดหรีดร่วมบุญ" className="w-full object-contain" />
        </div>
        {caption && (
          <p className="text-[11px] text-gold-500 text-center mt-2 leading-relaxed">{caption}</p>
        )}
      </div>
    </section>
  );
}
