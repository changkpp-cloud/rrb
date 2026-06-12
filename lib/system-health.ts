import { createAdminClient } from "@/lib/supabase/admin";

export type SystemIssueSeverity = "critical" | "warning" | "info";

export type SystemIssue = {
  id: string;
  title: string;
  detail: string;
  severity: SystemIssueSeverity;
  area: "ai" | "payments" | "printing" | "memorials" | "centers" | "database";
  count: number;
  href?: string;
  updatedAt?: string;
};

export type SystemHealth = {
  checkedAt: string;
  totalIssues: number;
  criticalCount: number;
  warningCount: number;
  issues: SystemIssue[];
};

const HOUR = 60 * 60 * 1000;

function isoAgo(ms: number) {
  return new Date(Date.now() - ms).toISOString();
}

function severityWeight(severity: SystemIssueSeverity) {
  if (severity === "critical") return 0;
  if (severity === "warning") return 1;
  return 2;
}

function addIssue(
  issues: SystemIssue[],
  issue: Omit<SystemIssue, "id"> & { id?: string }
) {
  if (issue.count <= 0) return;
  issues.push({
    ...issue,
    id: issue.id ?? `${issue.area}-${issue.title}`,
  });
}

export async function getSystemHealth(): Promise<SystemHealth> {
  const supabase = createAdminClient();
  const issues: SystemIssue[] = [];

  const [
    failedAi,
    stuckAi,
    pendingDonations,
    printErrors,
    stuckPrintJobs,
    activeMemorials,
    centers,
  ] = await Promise.all([
    (supabase.from("ai_photo_requests") as any)
      .select("id, error_message, created_at", { count: "exact" })
      .eq("status", "failed")
      .gte("created_at", isoAgo(24 * HOUR)),

    (supabase.from("ai_photo_requests") as any)
      .select("id, status, created_at", { count: "exact" })
      .in("status", ["pending", "processing"])
      .lt("created_at", isoAgo(10 * 60 * 1000)),

    supabase
      .from("donations")
      .select("id, memorial_id, donor_name, amount, created_at", { count: "exact" })
      .eq("status", "pending")
      .lt("created_at", isoAgo(6 * HOUR)),

    supabase
      .from("print_jobs")
      .select("id, error_message, queued_at", { count: "exact" })
      .eq("status", "error"),

    supabase
      .from("print_jobs")
      .select("id, status, queued_at", { count: "exact" })
      .in("status", ["queued", "printing"])
      .lt("queued_at", isoAgo(30 * 60 * 1000)),

    supabase
      .from("memorials")
      .select("id, name, center_id, funeral_status, ceremony_date, bank_account_number, host_bank_account_number, created_at")
      .eq("funeral_status", "active"),

    (supabase.from("centers") as any)
      .select("id, name, status, access_code, phone, manager_name"),
  ]);

  if (failedAi.error) {
    addIssue(issues, {
      area: "database",
      severity: "warning",
      title: "ระบบอ่านประวัติ AI ไม่ได้",
      detail: failedAi.error.message,
      count: 1,
      href: "/dashboard/admin/ai-prompts",
    });
  } else {
    addIssue(issues, {
      area: "ai",
      severity: "critical",
      title: "AI เจนภาพล้มเหลวใน 24 ชั่วโมง",
      detail: "มีงานสร้างภาพที่จบด้วยสถานะ failed ควรตรวจเครดิต, API key, หรือข้อความ error ล่าสุด",
      count: failedAi.count ?? failedAi.data?.length ?? 0,
      href: "/dashboard/admin/ai-prompts",
      updatedAt: failedAi.data?.[0]?.created_at,
    });
  }

  if (!stuckAi.error) {
    addIssue(issues, {
      area: "ai",
      severity: "warning",
      title: "AI ค้างนานเกิน 10 นาที",
      detail: "มีงาน pending/processing ค้างนาน ผู้ใช้อาจกลับมารับภาพแล้วไม่พบผลลัพธ์",
      count: stuckAi.count ?? stuckAi.data?.length ?? 0,
      href: "/dashboard/admin/ai-prompts",
      updatedAt: stuckAi.data?.[0]?.created_at,
    });
  }

  addIssue(issues, {
    area: "payments",
    severity: "warning",
    title: "สลิปรอตรวจนานเกิน 6 ชั่วโมง",
    detail: "ควรให้ศูนย์ที่เกี่ยวข้องตรวจสอบ เพราะผู้บริจาคอาจรอการยืนยันยอด",
    count: pendingDonations.count ?? pendingDonations.data?.length ?? 0,
    href: "/dashboard/admin/audit",
    updatedAt: pendingDonations.data?.[0]?.created_at,
  });

  addIssue(issues, {
    area: "printing",
    severity: "critical",
    title: "งานพิมพ์ป้ายมี error",
    detail: "พบ print job ที่ล้มเหลว ควรตรวจเครื่องพิมพ์/ไฟล์ป้าย/สถานะคิว",
    count: printErrors.count ?? printErrors.data?.length ?? 0,
    href: "/dashboard/admin/audit",
    updatedAt: printErrors.data?.[0]?.queued_at,
  });

  addIssue(issues, {
    area: "printing",
    severity: "warning",
    title: "คิวพิมพ์ค้างเกิน 30 นาที",
    detail: "มีงาน queued/printing ค้างนาน อาจทำให้ป้ายหน้างานไม่ออกตามเวลา",
    count: stuckPrintJobs.count ?? stuckPrintJobs.data?.length ?? 0,
    href: "/dashboard/admin/audit",
    updatedAt: stuckPrintJobs.data?.[0]?.queued_at,
  });

  const activeRows = activeMemorials.data ?? [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueCeremony = activeRows.filter((m) => {
    const ceremony = new Date(m.ceremony_date);
    ceremony.setHours(0, 0, 0, 0);
    return ceremony < today;
  });
  const missingBank = activeRows.filter((m) => !m.bank_account_number && !m.host_bank_account_number);
  const missingCenter = activeRows.filter((m) => !m.center_id);

  addIssue(issues, {
    area: "memorials",
    severity: "warning",
    title: "งาน active เลยวันพิธีแล้ว",
    detail: "ควรตรวจว่าศูนย์ลืมปิดงานหรือวันพิธีถูกกรอกผิด",
    count: overdueCeremony.length,
    href: "/dashboard/admin/memorials",
  });

  addIssue(issues, {
    area: "memorials",
    severity: "critical",
    title: "งาน active ไม่มีบัญชีรับเงิน",
    detail: "ผู้บริจาคอาจชำระเงินไม่ได้ ควรให้ศูนย์หรือเจ้าภาพเติมข้อมูลบัญชี",
    count: missingBank.length,
    href: "/dashboard/admin/memorials",
  });

  addIssue(issues, {
    area: "memorials",
    severity: "critical",
    title: "งาน active ไม่ผูกศูนย์",
    detail: "งานนี้อาจไม่อยู่ในคิวปฏิบัติงานของศูนย์ใด ควรตรวจสอบทันที",
    count: missingCenter.length,
    href: "/dashboard/admin/memorials",
  });

  if (!centers.error) {
    const centerRows = centers.data ?? [];
    addIssue(issues, {
      area: "centers",
      severity: "warning",
      title: "ศูนย์ active ไม่มีรหัสเข้าใช้งาน",
      detail: "ผู้จัดการศูนย์อาจเข้าแดชบอร์ดไม่ได้ ควรกำหนดรหัสเข้าใช้งานให้ครบ",
      count: centerRows.filter((c: any) => c.status === "active" && !c.access_code).length,
      href: "/dashboard/admin/centers",
    });

    addIssue(issues, {
      area: "centers",
      severity: "info",
      title: "ศูนย์ active ข้อมูลผู้รับผิดชอบไม่ครบ",
      detail: "ควรมีชื่อผู้จัดการและเบอร์โทร เพื่อให้แอดมินกลางประสานงานได้เร็ว",
      count: centerRows.filter((c: any) => c.status === "active" && (!c.manager_name || !c.phone)).length,
      href: "/dashboard/admin/centers",
    });
  }

  const sortedIssues = issues.sort((a, b) => {
    const severity = severityWeight(a.severity) - severityWeight(b.severity);
    if (severity !== 0) return severity;
    return b.count - a.count;
  });

  return {
    checkedAt: new Date().toISOString(),
    totalIssues: sortedIssues.reduce((sum, issue) => sum + issue.count, 0),
    criticalCount: sortedIssues.filter((issue) => issue.severity === "critical").reduce((sum, issue) => sum + issue.count, 0),
    warningCount: sortedIssues.filter((issue) => issue.severity === "warning").reduce((sum, issue) => sum + issue.count, 0),
    issues: sortedIssues,
  };
}
