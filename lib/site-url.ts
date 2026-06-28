export const SITE_URL = "https://ruamboon.online";

// สโลแกนแบรนด์ (ใช้ต่อท้าย meta description เวลาแชร์ลิงก์) — แก้ที่เดียวมีผลทุกหน้า
export const SITE_SLOGAN =
  "เปลี่ยนพวงหรีดเป็นทุน ร่วมบุญเจ้าภาพ ลดขยะต้นทาง สร้างสวัสดิการผู้วายชนม์";

export function getSiteUrl() {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  // เมินโดเมน vercel (preview/อัตโนมัติ) — ใช้โดเมนจริง ruamboon.online เสมอ
  // (rrb.center ยังใช้งานได้คู่กัน ลิงก์เก่าที่ชี้มา rrb.center เปิดได้ปกติ)
  if (env && !/vercel\.app$/i.test(env)) return env;
  return SITE_URL;
}
