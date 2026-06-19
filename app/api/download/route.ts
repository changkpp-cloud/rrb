import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let imageRes: Response;
  try {
    imageRes = await fetch(url, { cache: "no-store" });
    if (!imageRes.ok) throw new Error(`Upstream fetch failed: ${imageRes.status}`);
  } catch {
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
  }

  const contentType = imageRes.headers.get("content-type") ?? "image/png";
  const ext = contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "png";
  const buffer = await imageRes.arrayBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="rrb-ecard.${ext}"`,
      "Cache-Control": "no-store",
    },
  });
}
