// ส่ง SMS ผ่าน ThaiBulkSMS (https://www.thaibulksms.com) — API v2
//   POST https://api-v2.thaibulksms.com/sms  (application/x-www-form-urlencoded)
//   Auth: HTTP Basic (username = API key, password = API secret)
//   params: msisdn, message, sender, sms_type
//
// ต้องตั้ง env 3 ตัวถึงจะส่งจริง (ดู CLAUDE.md):
//   THAIBULKSMS_API_KEY, THAIBULKSMS_API_SECRET, THAIBULKSMS_SENDER (ชื่อผู้ส่งที่จดทะเบียนแล้ว)
// ถ้าไม่ตั้ง → isSmsConfigured() = false → ระบบ fallback เป็นโหมดทดสอบ (โชว์รหัสบนจอ) ไม่พัง

const THAIBULKSMS_ENDPOINT = "https://api-v2.thaibulksms.com/sms";
const SMS_TIMEOUT_MS = 15_000;

export function isSmsConfigured(): boolean {
  return Boolean(
    process.env.THAIBULKSMS_API_KEY &&
    process.env.THAIBULKSMS_API_SECRET &&
    process.env.THAIBULKSMS_SENDER,
  );
}

export type SendSmsResult =
  | { sent: true }
  | { sent: false; reason: "not_configured" }
  | { sent: false; reason: "error"; error: string };

export async function sendSms(to: string, message: string): Promise<SendSmsResult> {
  const apiKey = process.env.THAIBULKSMS_API_KEY;
  const apiSecret = process.env.THAIBULKSMS_API_SECRET;
  const sender = process.env.THAIBULKSMS_SENDER;
  if (!apiKey || !apiSecret || !sender) return { sent: false, reason: "not_configured" };

  const body = new URLSearchParams({
    msisdn: to,
    message,
    sender,
    sms_type: process.env.THAIBULKSMS_SMS_TYPE || "standard",
  });
  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

  try {
    const res = await fetch(THAIBULKSMS_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: body.toString(),
      signal: AbortSignal.timeout(SMS_TIMEOUT_MS),
    });
    const text = await res.text();
    if (!res.ok) {
      return { sent: false, reason: "error", error: `HTTP ${res.status}: ${text.slice(0, 300)}` };
    }
    // ThaiBulkSMS ตอบ JSON — ถ้ามี error code ในเนื้อหาให้ถือว่าไม่สำเร็จ
    try {
      const data = JSON.parse(text) as { error?: unknown; code?: unknown };
      if (data && (data.error || (typeof data.code === "string" && data.code !== "0"))) {
        return { sent: false, reason: "error", error: text.slice(0, 300) };
      }
    } catch {
      // ไม่ใช่ JSON แต่ HTTP 2xx → ถือว่าส่งแล้ว
    }
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: "error", error: e instanceof Error ? e.message : String(e) };
  }
}

/** ส่งรหัส OTP ยืนยันเบอร์เจ้าภาพ */
export function sendOtpSms(to: string, code: string): Promise<SendSmsResult> {
  return sendSms(to, `รหัสยืนยันหรีดร่วมบุญ: ${code} (หมดอายุ 10 นาที) อย่าบอกผู้อื่น`);
}
