/**
 * แจ้งเตือนเจ้าภาพผ่าน SMS (ThaiBulkSMS — ตัวเดียวกับ OTP)
 *
 * - ส่งจริงเมื่อตั้ง env THAIBULKSMS_* ครบ (ดู lib/sms.ts) · ถ้าไม่ตั้ง = ไม่ส่ง (no-op) ไม่พัง
 * - best-effort เสมอ: ไม่ throw ออกไปขัดจังหวะ flow การร่วมบุญ
 *
 * หมายเหตุ: เดิมใช้ Twilio + LINE Notify — LINE Notify ปิดบริการแล้ว (มี.ค. 2025)
 * และ Twilio เป็นคนละเจ้ากับ OTP จึงรวมมาที่ ThaiBulkSMS เจ้าเดียว
 */

import { sendSms } from "@/lib/sms";

/** ส่ง SMS แจ้งเตือนไปเบอร์เจ้าภาพ — best-effort, ไม่ throw */
export async function notifyHost(params: {
  hostPhone?: string | null;
  message: string;
}): Promise<void> {
  const { hostPhone, message } = params;
  if (!hostPhone) return;
  try {
    await sendSms(hostPhone, message);
  } catch (e) {
    console.warn("[notify] SMS error:", (e as Error).message);
  }
}

/** ข้อความ: มีผู้ร่วมบุญใหม่ (donation auto-confirm + ป้ายชื่อพิมพ์อัตโนมัติ) */
export function msgNewDonation(params: {
  memorialName: string;
  donorName: string;
  donorTitle?: string | null;
  amount: number;
  hostId: string;
}): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const link = `${base}/dashboard/host/${params.hostId}`;
  const donor = [params.donorTitle, params.donorName].filter(Boolean).join(" ");
  return [
    `🌸 หรีดร่วมบุญ: มีผู้ร่วมบุญใหม่`,
    `งาน ${params.memorialName}`,
    `${donor} — ${params.amount.toLocaleString("th-TH")} บาท`,
    `เข้าบัญชีเจ้าภาพโดยตรง · ป้ายชื่อกำลังพิมพ์`,
    `ดูรายการ: ${link}`,
  ].join("\n");
}
