import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { AlertTriangle, Clock, Banknote, Building2, ChevronRight, CheckCircle2 } from "lucide-react";
import { formatThaiDate } from "@/lib/memorial";

export const revalidate = 60;
export const dynamic = "force-dynamic";

async function getData() {
  const supabase = createAdminClient();

  const [
    { data: pendingDonations },
    { data: largeDonations },
    { data: memorials },
    { data: auditLogs },
  ] = await Promise.all([
    // สลิปรอตรวจ
    supabase
      .from("donations")
      .select("id, memorial_id, amount, donor_name, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(30),

    // ยอดเงินสูงผิดปกติ (>= 10,000)
    supabase
      .from("donations")
      .select("id, memorial_id, amount, donor_name, created_at, status")
      .gte("amount", 10000)
      .order("amount", { ascending: false })
      .limit(20),

    // งานศพที่น่าสงสัย
    supabase
      .from("memorials")
      .select("id, name, center_id, funeral_status, bank_account_number, created_at, ceremony_date"),

    // Audit log ล่าสุด
    supabase
      .from("audit_logs")
      .select("id, action, table_name, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  // งานที่ไม่มีศูนย์
  const noCenter = (memorials ?? []).filter(m => !m.center_id && m.funeral_status !== "closed");

  // งานที่ไม่มีบัญชีรับเงิน แต่ยังเปิดอยู่
  const noBankAccount = (memorials ?? []).filter(
    m => !m.bank_account_number && m.funeral_status === "active"
  );

  // งานที่เปิดนานเกิน 45 วัน
  const now = new Date();
  const staleActive = (memorials ?? []).filter(m => {
    if (m.funeral_status !== "active") return false;
    const created = new Date(m.created_at);
    return (now.getTime() - created.getTime()) > 45 * 24 * 60 * 60 * 1000;
  });

  const totalIssues =
    (pendingDonations?.length ?? 0) +
    noCenter.length +
    noBankAccount.length +
    staleActive.length;

  return {
    pendingDonations: pendingDonations ?? [],
    largeDonations: largeDonations ?? [],
    noCenter,
    noBankAccount,
    staleActive,
    auditLogs: auditLogs ?? [],
    totalIssues,
  };
}

export default async function AdminAuditPage() {
  const d = await getData();

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-bold text-gold-800">ตรวจสอบความผิดปกติ</h2>
          <p className="text-[11px] text-gold-500">สลิป · งาน · เงิน · บัญชี · กิจกรรมระบบ</p>
        </div>
        {d.totalIssues > 0 ? (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            {d.totalIssues} รายการ
          </span>
        ) : (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            ปกติ
          </span>
        )}
      </div>

      {/* ── 1. สลิปรอตรวจ ─────────────────────────────────────── */}
      <Section
        icon={<Clock className="w-4 h-4 text-amber-500" />}
        title={`สลิปรอตรวจสอบ`}
        count={d.pendingDonations.length}
        badgeColor="bg-amber-100 text-amber-700"
        empty="ไม่มีสลิปรอตรวจ"
      >
        {d.pendingDonations.map(don => (
          <Link key={don.id} href={`/dashboard/admin/memorials/${don.memorial_id}`}
            className="flex items-center justify-between bg-white rounded-xl border border-amber-200 px-4 py-2.5 hover:bg-amber-50 transition-colors">
            <div>
              <p className="text-sm font-semibold text-gold-800">{don.donor_name || "ไม่ระบุชื่อ"}</p>
              <p className="text-[10px] text-gold-500">
                {new Date(don.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}
                {" · "}{(don.amount || 0).toLocaleString()} บาท
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">รอตรวจ</span>
              <ChevronRight className="w-3.5 h-3.5 text-gold-400" />
            </div>
          </Link>
        ))}
      </Section>

      {/* ── 2. งานที่ไม่มีศูนย์ ────────────────────────────────── */}
      {d.noCenter.length > 0 && (
        <Section
          icon={<Building2 className="w-4 h-4 text-red-500" />}
          title="งานที่ไม่ได้ผูกกับศูนย์"
          count={d.noCenter.length}
          badgeColor="bg-red-100 text-red-700"
        >
          {d.noCenter.map(m => (
            <Link key={m.id} href={`/dashboard/admin/memorials/${m.id}`}
              className="flex items-center justify-between bg-white rounded-xl border border-red-200 px-4 py-2.5 hover:bg-red-50 transition-colors">
              <div>
                <p className="text-sm font-semibold text-gold-800">{m.name}</p>
                <p className="text-[10px] text-red-500">ไม่มีศูนย์ · ฌาปนกิจ {formatThaiDate(m.ceremony_date)}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gold-400 shrink-0" />
            </Link>
          ))}
        </Section>
      )}

      {/* ── 3. งานที่เปิดแต่ไม่มีบัญชี ───────────────────────── */}
      {d.noBankAccount.length > 0 && (
        <Section
          icon={<Banknote className="w-4 h-4 text-orange-500" />}
          title="งานเปิดอยู่แต่ไม่มีบัญชีรับเงิน"
          count={d.noBankAccount.length}
          badgeColor="bg-orange-100 text-orange-700"
        >
          {d.noBankAccount.map(m => (
            <Link key={m.id} href={`/dashboard/admin/memorials/${m.id}`}
              className="flex items-center justify-between bg-white rounded-xl border border-orange-200 px-4 py-2.5 hover:bg-orange-50 transition-colors">
              <div>
                <p className="text-sm font-semibold text-gold-800">{m.name}</p>
                <p className="text-[10px] text-orange-600">ยังไม่มีบัญชีธนาคาร · ผู้ร่วมบุญยังโอนไม่ได้</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gold-400 shrink-0" />
            </Link>
          ))}
        </Section>
      )}

      {/* ── 4. งานที่เปิดนานเกิน 45 วัน ──────────────────────── */}
      {d.staleActive.length > 0 && (
        <Section
          icon={<AlertTriangle className="w-4 h-4 text-yellow-500" />}
          title="งานเปิดนานผิดปกติ (>45 วัน)"
          count={d.staleActive.length}
          badgeColor="bg-yellow-100 text-yellow-700"
        >
          {d.staleActive.map(m => {
            const days = Math.floor((Date.now() - new Date(m.created_at).getTime()) / (86400 * 1000));
            return (
              <Link key={m.id} href={`/dashboard/admin/memorials/${m.id}`}
                className="flex items-center justify-between bg-white rounded-xl border border-yellow-200 px-4 py-2.5 hover:bg-yellow-50 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-gold-800">{m.name}</p>
                  <p className="text-[10px] text-yellow-700">เปิดมาแล้ว {days} วัน — ควรปิดงานหรือตรวจสอบ</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gold-400 shrink-0" />
              </Link>
            );
          })}
        </Section>
      )}

      {/* ── 5. ยอดเงินสูงผิดปกติ ──────────────────────────────── */}
      {d.largeDonations.length > 0 && (
        <Section
          icon={<Banknote className="w-4 h-4 text-purple-500" />}
          title="ยอดเงินสูง (≥ 10,000 บาท)"
          count={d.largeDonations.length}
          badgeColor="bg-purple-100 text-purple-700"
          collapsible
        >
          {d.largeDonations.map(don => (
            <Link key={don.id} href={`/dashboard/admin/memorials/${don.memorial_id}`}
              className="flex items-center justify-between bg-white rounded-xl border border-purple-200 px-4 py-2.5 hover:bg-purple-50 transition-colors">
              <div>
                <p className="text-sm font-bold text-purple-700">{(don.amount || 0).toLocaleString()} บาท</p>
                <p className="text-[10px] text-gold-500">{don.donor_name || "ไม่ระบุชื่อ"} · สถานะ: {don.status}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gold-400 shrink-0" />
            </Link>
          ))}
        </Section>
      )}

      {/* ── 6. Audit Log ──────────────────────────────────────── */}
      <Section
        icon={<Clock className="w-4 h-4 text-gold-500" />}
        title="กิจกรรมระบบล่าสุด (Audit Log)"
        count={d.auditLogs.length}
        badgeColor="bg-gold-100 text-gold-700"
        collapsible
      >
        {d.auditLogs.length === 0 ? (
          <p className="text-sm text-gold-400 text-center py-3">ยังไม่มีข้อมูล Audit Log</p>
        ) : d.auditLogs.map(log => (
          <div key={log.id} className="bg-white rounded-xl border border-gold-200 px-4 py-2.5">
            <p className="text-xs font-semibold text-gold-800">{log.action}</p>
            <p className="text-[10px] text-gold-500">
              {log.table_name ?? "—"} · {new Date(log.created_at).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
              {log.user_id && ` · ${log.user_id.slice(0, 8)}…`}
            </p>
          </div>
        ))}
      </Section>

      <div className="h-2" />
    </div>
  );
}

function Section({
  icon,
  title,
  count,
  badgeColor,
  children,
  empty,
  collapsible: _collapsible,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  badgeColor: string;
  children?: React.ReactNode;
  empty?: string;
  collapsible?: boolean;
}) {
  return (
    <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {icon}
          <p className="text-xs font-semibold text-gold-700">{title}</p>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${badgeColor}`}>
          {count}
        </span>
      </div>
      {count === 0 && empty ? (
        <div className="flex items-center gap-2 py-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-xs text-emerald-600">{empty}</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
