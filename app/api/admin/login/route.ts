import { NextRequest, NextResponse } from "next/server";
import { createAdminToken, ADMIN_SESSION_COOKIE } from "@/lib/admin-session";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateLimitKey = `admin-login:${ip}`;

  const { allowed } = checkRateLimit(rateLimitKey, MAX_ATTEMPTS, WINDOW_MS);
  if (!allowed) {
    return NextResponse.json(
      { error: "พยายามเข้าสู่ระบบมากเกินไป กรุณารอ 15 นาทีแล้วลองใหม่" },
      { status: 429 }
    );
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json(
      { error: "ระบบยังไม่ได้ตั้งค่า ADMIN_PASSWORD" },
      { status: 503 }
    );
  }

  const { password } = await req.json();
  if (password !== adminPassword) {
    return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }

  resetRateLimit(rateLimitKey);

  const token = createAdminToken();
  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
  return res;
}
