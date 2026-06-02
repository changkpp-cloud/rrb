import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_HOURS = 8;

function getSecret(): string {
  const s = process.env.ADMIN_SESSION_SECRET ?? process.env.ADMIN_PASSWORD;
  if (!s) throw new Error("ADMIN_SESSION_SECRET is not configured");
  return s;
}

export function createAdminToken(): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_HOURS * 3600;
  const payload = `admin:${exp}`;
  const sig = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifyAdminToken(token: string | undefined | null): boolean {
  if (!token) return false;
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return false;
    const payload = token.slice(0, dot);
    const sigHex = token.slice(dot + 1);
    const expectedHex = createHmac("sha256", getSecret())
      .update(payload)
      .digest("hex");
    // sha256 = 32 bytes = 64 hex chars always
    if (sigHex.length !== 64 || expectedHex.length !== 64) return false;
    if (!timingSafeEqual(Buffer.from(sigHex, "hex"), Buffer.from(expectedHex, "hex"))) return false;
    const colonIdx = payload.indexOf(":");
    if (colonIdx === -1) return false;
    const exp = parseInt(payload.slice(colonIdx + 1), 10);
    return Number.isFinite(exp) && Date.now() / 1000 < exp;
  } catch {
    return false;
  }
}

export async function getAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminToken(token);
}
