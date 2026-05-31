/**
 * Notification utility — SMS via Twilio + LINE Notify (optional)
 *
 * Required env vars (at least one channel must be configured):
 *   TWILIO_ACCOUNT_SID    — Twilio account SID
 *   TWILIO_AUTH_TOKEN     — Twilio auth token
 *   TWILIO_FROM_NUMBER    — Twilio sender number e.g. +15005550006
 *
 * Optional:
 *   LINE_NOTIFY_TOKEN     — LINE Notify group/personal token
 *   NEXT_PUBLIC_SITE_URL  — base URL for dashboard links in messages
 */

function formatThaiPhone(raw: string): string {
  const cleaned = raw.replace(/[-\s()]/g, "");
  if (cleaned.startsWith("+66")) return cleaned;
  if (cleaned.startsWith("0")) return "+66" + cleaned.slice(1);
  return "+66" + cleaned;
}

async function sendTwilioSMS(to: string, body: string): Promise<void> {
  const sid  = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) return;

  const url  = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const form = new URLSearchParams({ To: to, From: from, Body: body });

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error((d as { message?: string }).message ?? `Twilio ${res.status}`);
  }
}

async function sendLineNotify(message: string): Promise<void> {
  const token = process.env.LINE_NOTIFY_TOKEN;
  if (!token) return;

  const form = new URLSearchParams({ message });
  const res = await fetch("https://notify-api.line.me/api/notify", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });
  if (!res.ok) throw new Error(`LINE Notify ${res.status}`);
}

/** Send to host phone (SMS) and/or LINE Notify group — best-effort, never throws */
export async function notifyHost(params: {
  hostPhone?: string | null;
  message: string;
}): Promise<void> {
  const { hostPhone, message } = params;
  const tasks: Promise<void>[] = [];

  if (hostPhone) {
    tasks.push(
      sendTwilioSMS(formatThaiPhone(hostPhone), message).catch(e =>
        console.warn("[notify] SMS error:", (e as Error).message)
      )
    );
  }

  tasks.push(
    sendLineNotify(message).catch(e =>
      console.warn("[notify] LINE Notify error:", (e as Error).message)
    )
  );

  await Promise.allSettled(tasks);
}

/** Message: new donation pending (sent right after donor submits) */
export function msgNewDonation(params: {
  memorialName: string;
  donorName: string;
  donorTitle?: string | null;
  amount: number;
  hostId: string;
}): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const link = `${base}/dashboard/host/${params.hostId}`;
  const titleLine = params.donorTitle ? `\n   ${params.donorTitle}` : "";
  return [
    `🌸 หรีดร่วมบุญ`,
    `มีผู้ร่วมบุญใหม่! — ${params.memorialName}`,
    ``,
    `👤 ${params.donorName}${titleLine}`,
    `💰 ยอด ${params.amount.toLocaleString("th-TH")} บาท`,
    `📋 รอตรวจสลิป`,
    ``,
    `🖨️ ตรวจสอบเครื่องพิมพ์ป้ายชื่อ`,
    `🔗 ${link}`,
  ].join("\n");
}

/** Message: donation confirmed by center */
export function msgDonationConfirmed(params: {
  memorialName: string;
  donorName: string;
  amount: number;
  hostId: string;
}): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const link = `${base}/dashboard/host/${params.hostId}`;
  return [
    `✅ ยืนยันการร่วมบุญแล้ว`,
    `งาน: ${params.memorialName}`,
    `👤 ${params.donorName} — ${params.amount.toLocaleString("th-TH")} บาท`,
    ``,
    `🖨️ ป้ายชื่อพร้อมพิมพ์ — ตรวจสอบเครื่องพิมพ์`,
    `🔗 ${link}`,
  ].join("\n");
}
