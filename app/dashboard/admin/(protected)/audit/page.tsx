import { createAdminClient } from "@/lib/supabase/admin";
import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AuditRow = {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_value: unknown;
  new_value: unknown;
  ip_address: string | null;
  created_at: string;
};

const ACTION_LABEL: Record<string, string> = {
  verify_host_bank: "แก้/ยืนยันบัญชีรับเงินเจ้าภาพ (OTP)",
  close_memorial: "ปิดงาน",
  confirm_transfer: "ยืนยันเก็บค่าดำเนินการ / คืนบอร์ด",
  edit_memorial_info: "แก้ข้อมูลงาน",
};

function fmt(ts: string) {
  try {
    return new Date(ts).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return ts;
  }
}

function compact(value: unknown): string {
  if (value == null) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export default async function AdminAuditPage() {
  const supabase = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from("audit_logs") as any)
    .select("id, user_id, action, table_name, record_id, old_value, new_value, ip_address, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as AuditRow[];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-gold-600" />
        <div>
          <h1 className="text-lg font-bold text-gold-900">บันทึกกิจกรรม (Audit Log)</h1>
          <p className="text-xs text-gold-500">บันทึกการกระทำสำคัญเรื่องเงิน: แก้บัญชี/ยืนยันเบอร์ · ปิดงาน · เก็บค่าดำเนินการ (200 รายการล่าสุด)</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-gold-200 bg-cream-50 p-6 text-center text-sm text-gold-600">
          ยังไม่มีบันทึกกิจกรรม
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="rounded-xl border border-gold-200 bg-white px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-bold text-gold-800">{ACTION_LABEL[r.action] ?? r.action}</span>
                {r.user_id && (
                  <span className="rounded-full bg-cream-100 px-2 py-0.5 text-[10px] font-semibold text-gold-700">
                    โดย {r.user_id}
                  </span>
                )}
                <span className="ml-auto text-[11px] text-gold-400">{fmt(r.created_at)}</span>
              </div>
              <div className="mt-1 space-y-0.5 text-[11px] leading-relaxed text-gold-600">
                {r.record_id && <p>งาน/รายการ: <span className="font-mono text-gold-700">{r.record_id}</span></p>}
                {r.old_value != null && <p className="break-all">เดิม: <span className="text-gold-500">{compact(r.old_value)}</span></p>}
                {r.new_value != null && <p className="break-all">ใหม่: <span className="text-gold-700">{compact(r.new_value)}</span></p>}
                {r.ip_address && <p className="text-gold-400">IP: {r.ip_address}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
