import { NextRequest, NextResponse } from "next/server";
import { createHostToken, HOST_SESSION_COOKIE } from "@/lib/host-session";
import { getMemorialByHostCode } from "@/lib/memorial";

export async function GET(request: NextRequest) {
  const code = new URL(request.url).searchParams.get("code");
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

  const memorial = await getMemorialByHostCode(code);
  if (!memorial) {
    return NextResponse.json({ error: "ไม่พบรหัสเจ้าภาพนี้" }, { status: 404 });
  }

  if (
    memorial.funeral_status === "closed" &&
    memorial.host_expires_at &&
    new Date(memorial.host_expires_at) < new Date()
  ) {
    return NextResponse.json(
      { error: "สิทธิ์เจ้าภาพหมดอายุแล้ว — ข้อมูลถูกล็อกหลังปิดงาน 30 วัน" },
      { status: 410 }
    );
  }

  const res = NextResponse.json({ id: memorial.id, name: memorial.name });
  res.cookies.set(HOST_SESSION_COOKIE, createHostToken(memorial.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60,
  });
  return res;
}
