import { timingSafeEqual } from "crypto";

/**
 * รหัสมาสเตอร์ (ช่วงทดสอบ) — เข้าได้ทุกแดชบอร์ดด้วยรหัสเดียว
 * ตั้งค่าผ่าน env MASTER_ACCESS_CODE เท่านั้น ถ้าไม่ตั้ง = ปิดฟีเจอร์นี้ทั้งหมด
 * เทียบแบบ case-insensitive และใช้ timingSafeEqual กันการเดารหัสจากเวลา
 */
export function isMasterCode(input: string | null | undefined): boolean {
  const master = process.env.MASTER_ACCESS_CODE?.trim();
  if (!master) return false;
  const a = String(input ?? "").trim().toUpperCase();
  const b = master.toUpperCase();
  if (!a || a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}
