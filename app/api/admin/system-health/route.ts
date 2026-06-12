import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSystemHealth } from "@/lib/system-health";

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session || session.value !== "ok") {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
  }

  const health = await getSystemHealth();
  return NextResponse.json({
    checkedAt: health.checkedAt,
    totalIssues: health.totalIssues,
    criticalCount: health.criticalCount,
    warningCount: health.warningCount,
  });
}
