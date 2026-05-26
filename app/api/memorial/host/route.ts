import { NextRequest, NextResponse } from "next/server";
import { getMemorialByHostCode } from "@/lib/memorial";

export async function GET(request: NextRequest) {
  const code = new URL(request.url).searchParams.get("code");
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

  const memorial = await getMemorialByHostCode(code);
  if (!memorial) {
    return NextResponse.json({ error: "ไม่พบรหัสเจ้าภาพนี้" }, { status: 404 });
  }

  return NextResponse.json({ id: memorial.id, name: memorial.name });
}
