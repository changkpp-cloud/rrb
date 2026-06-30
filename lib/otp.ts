// OTP ยืนยันเบอร์/บัญชีเจ้าภาพ
// ส่ง SMS จริงผ่าน ThaiBulkSMS (lib/sms.ts) เมื่อตั้ง env THAIBULKSMS_* ครบ
// ถ้าไม่ตั้ง → โหมดทดสอบ: generate รหัส เก็บใน DB แล้วคืน devCode ให้ UI/log แสดง

export const OTP_TTL_MS = 10 * 60 * 1000; // รหัสหมดอายุใน 10 นาที
// เบอร์ที่ยืนยัน OTP แล้ว ใช้เปิดงานได้ภายในกรอบเวลานี้ (กันยืนยันทิ้งไว้นานแล้วเอาไปเปิดงานอื่น)
export const OTP_VERIFY_WINDOW_MS = 30 * 60 * 1000; // 30 นาที

/** สร้างรหัส OTP 6 หลัก */
export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** normalize เบอร์ไทยให้เหลือเฉพาะตัวเลข (รองรับ +66/เว้นวรรค/ขีด) */
export function normalizePhone(raw: string): string {
  let p = (raw ?? "").replace(/[^\d]/g, "");
  if (p.startsWith("66") && p.length === 11) p = "0" + p.slice(2);
  return p;
}

/** ตรวจรูปแบบเบอร์มือถือไทย (0 ตามด้วย 9 หลัก) */
export function isValidThaiMobile(phone: string): boolean {
  return /^0\d{9}$/.test(normalizePhone(phone));
}
