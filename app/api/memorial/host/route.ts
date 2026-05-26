import { NextRequest, NextResponse } from "next/server";
import { getMemorialByHostCode, DEMO_MEMORIAL } from "@/lib/memorial";

export async function GET(request: NextRequest) {
  const code = new URL(request.url).searchParams.get("code");
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

  if (code === "DEMO001") {
    return NextResponse.json({ id: DEMO_MEMORIAL.id, name: DEMO_MEMORIAL.name });
  }

  const memorial = await getMemorialByHostCode(code);
  if (!memorial) {
    return NextResponse.json({ error: "ไม่พบรหัสเจ้าภาพนี้" }, { status: 404 });
  }

  return NextResponse.json({ id: memorial.id, name: memorial.name });
}
