import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const HOST_SESSION_COOKIE = "host_session";
const SESSION_HOURS = 8;

function getSecret(): string {
  const secret = process.env.HOST_SESSION_SECRET ?? process.env.ADMIN_SESSION_SECRET ?? process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error("HOST_SESSION_SECRET is not configured");
  return secret;
}

export function createHostToken(memorialId: string): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_HOURS * 3600;
  const payload = `host:${memorialId}:${exp}`;
  const sig = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifyHostToken(token: string | undefined | null, memorialId: string): boolean {
  if (!token) return false;
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return false;
    const payload = token.slice(0, dot);
    const sigHex = token.slice(dot + 1);
    const parts = payload.split(":");
    if (parts.length !== 3 || parts[0] !== "host" || parts[1] !== memorialId) return false;
    const expectedHex = createHmac("sha256", getSecret()).update(payload).digest("hex");
    if (sigHex.length !== 64 || expectedHex.length !== 64) return false;
    if (!timingSafeEqual(Buffer.from(sigHex, "hex"), Buffer.from(expectedHex, "hex"))) return false;
    const exp = Number(parts[2]);
    return Number.isFinite(exp) && Date.now() / 1000 < exp;
  } catch {
    return false;
  }
}

export async function hasHostSession(memorialId: string): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyHostToken(cookieStore.get(HOST_SESSION_COOKIE)?.value, memorialId);
}
