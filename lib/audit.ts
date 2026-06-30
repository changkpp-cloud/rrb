// บันทึก audit log เรื่องสำคัญ (โดยเฉพาะเรื่องเงิน) ลงตาราง audit_logs
// best-effort เสมอ — ต้องไม่ throw/บล็อก flow หลัก

import { createAdminClient } from "@/lib/supabase/admin";

type AuditParams = {
  action: string;
  recordId?: string | null;
  userId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
  tableName?: string;
};

export async function logAudit(p: AuditParams): Promise<void> {
  try {
    const supabase = createAdminClient();
    // audit_logs ยังไม่อยู่ใน generated types — cast ตามแพทเทิร์น repo
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("audit_logs") as any).insert({
      user_id: p.userId ?? null,
      action: p.action,
      table_name: p.tableName ?? "memorials",
      record_id: p.recordId ?? null,
      old_value: p.oldValue ?? null,
      new_value: p.newValue ?? null,
      ip_address: p.ipAddress ?? null,
      created_at: new Date().toISOString(),
    });
  } catch {
    /* audit ต้องไม่บล็อก flow หลัก */
  }
}

/** ดึง client IP จาก request header (best-effort) */
export function getClientIp(req: Request): string | null {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}
