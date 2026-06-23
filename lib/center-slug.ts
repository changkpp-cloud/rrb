/**
 * prefix ของ slug งานศพ = รหัสประจำศูนย์ (อปท. official_lgo_code 8 หลัก)
 * fallback เป็น center_code ที่ทำให้สะอาด — ใช้ร่วมกันทั้งฝั่ง API และฟอร์ม
 */
export function centerSlugPrefix(
  center: { official_lgo_code?: string | null; center_code?: string | null } | null | undefined,
): string {
  if (!center) return "";
  if (center.official_lgo_code) {
    return String(center.official_lgo_code).replace(/\D/g, "").slice(0, 8);
  }
  if (center.center_code) {
    return String(center.center_code)
      .replace(/^RRB-/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }
  return "";
}

/** ทำให้ส่วนชื่อใน slug ปลอดภัยสำหรับ URL: a-z 0-9 และ - เท่านั้น */
export function sanitizeSlugPart(part: string): string {
  return part
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
