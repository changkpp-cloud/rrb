export const SITE_URL = "https://ruamboon.online";

export function getSiteUrl() {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  // เมินโดเมน vercel (preview/อัตโนมัติ) — ใช้โดเมนจริง ruamboon.online เสมอ
  // (rrb.center ยังใช้งานได้คู่กัน ลิงก์เก่าที่ชี้มา rrb.center เปิดได้ปกติ)
  if (env && !/vercel\.app$/i.test(env)) return env;
  return SITE_URL;
}
