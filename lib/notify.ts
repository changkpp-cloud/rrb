/**
 * แจ้งเตือนผ่าน SMS (ThaiBulkSMS — ตัวเดียวกับ OTP)
 *
 * - ส่งจริงเมื่อตั้ง env THAIBULKSMS_* ครบ (ดู lib/sms.ts) · ถ้าไม่ตั้ง = ไม่ส่ง (no-op) ไม่พัง
 * - best-effort เสมอ: ไม่ throw ออกไปขัดจังหวะ flow
 *
 * นโยบายแจ้งเตือน (ดู CHANGELOG):
 *  - ไม่ส่ง SMS หาเจ้าภาพรายคนตอนมีผู้ร่วมบุญ — เงินมีแจ้งเตือนจากแอปธนาคารอยู่แล้ว
 *    และรายชื่อดูได้ในแดชบอร์ด (เลี่ยงรบกวน + ประหยัดค่า SMS)
 *  - แจ้ง "ศูนย์" เฉพาะเรื่องที่ต้องลงมือจริง เช่น ป้ายชื่อพิมพ์ไม่สำเร็จ
 */

import { sendSms } from "@/lib/sms";

async function notifySms(phone: string | null | undefined, message: string): Promise<void> {
  if (!phone) return;
  try {
    await sendSms(phone, message);
  } catch (e) {
    console.warn("[notify] SMS error:", (e as Error).message);
  }
}

/** แจ้งศูนย์เมื่อป้ายชื่อพิมพ์ไม่สำเร็จ — ให้ตรวจเครื่องพิมพ์แล้วกด "พิมพ์ซ้ำ" ในระบบ */
export async function notifyNameplateError(params: {
  centerPhone?: string | null;
  memorialName: string;
  donorName: string;
}): Promise<void> {
  const msg = [
    `🖨️ หรีดร่วมบุญ: ป้ายชื่อพิมพ์ไม่สำเร็จ`,
    `งาน ${params.memorialName}`,
    `ผู้ร่วมบุญ ${params.donorName}`,
    `กรุณาตรวจเครื่องพิมพ์ แล้วกด "พิมพ์ซ้ำ" ในระบบ`,
  ].join("\n");
  await notifySms(params.centerPhone, msg);
}
