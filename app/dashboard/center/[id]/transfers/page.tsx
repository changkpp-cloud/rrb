import Link from "next/link";
import { redirect } from "next/navigation";
import IosPageHeader from "@/components/IosPageHeader";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCenterByRouteKey, getCenterRouteKey } from "@/lib/center-route";
import { getCenterAccess, roleLabel } from "@/lib/iam";
import { formatThaiDate } from "@/lib/memorial";
import { AlertTriangle, Banknote, CheckCircle2, ChevronRight, Clock, Users } from "lucide-react";

export const revalidate = 30;

const SYSTEM_FEE = 100;

type MemorialRow = {
  id: string;
  name: string;
  ceremony_date: string;
  funeral_status: "draft" | "active" | "closed";
  host_name: string | null;
  host_bank_name: string | null;
  host_bank_account_number: string | null;
  host_bank_account_name: string | null;
  transfer_confirmed_at: string | null;
};

type DonationRow = {
  memorial_id: string;
  amount: number | null;
  status: string;
  nameplate_status: string;
};

async function getTransfers(centerId: string) {
  const supabase = createAdminClient();
  const { data: memorialsData } = await supabase
    .from("memorials")
    .select("id, name, ceremony_date, funeral_status, host_name, host_bank_name, host_bank_account_number, host_bank_account_name, transfer_confirmed_at")
    .eq("center_id", centerId)
    .in("funeral_status", ["active", "closed"])
    .order("ceremony_date", { ascending: false });

  const memorials = (memorialsData ?? []) as MemorialRow[];
  if (memorials.length === 0) return [];

  const ids = memorials.map((m) => m.id);
  const { data: donationsData } = await supabase
    .from("donations")
    .select("memorial_id, amount, status, nameplate_status")
    .in("memorial_id", ids);

  const donationMap = new Map<string, DonationRow[]>();
  for (const d of (donationsData ?? []) as DonationRow[]) {
    const rows = donationMap.get(d.memorial_id) ?? [];
    rows.push(d);
    donationMap.set(d.memorial_id, rows);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return memorials
    .map((m) => {
      const rows = donationMap.get(m.id) ?? [];
      const confirmed = rows.filter((d) => d.status === "confirmed");
      const amount = confirmed.reduce((sum, d) => sum + (d.amount ?? 0), 0);
      const failedPrints = confirmed.filter((d) => d.nameplate_status === "error").length;
      const ceremonyReached = new Date(m.ceremony_date) <= today;
      const netAmount = Math.max(amount - confirmed.length * SYSTEM_FEE, 0);
      const hasHostBank = Boolean(m.host_bank_account_number);
      // พร้อมโอน = งาน active, ถึงวันฌาปนกิจ, มีผู้ร่วมบุญ, มีบัญชีเจ้าภาพ (ไม่ผูกกับการติดบอร์ด — พิมพ์แล้วถือว่าจบ)
      const ready = m.funeral_status === "active" && ceremonyReached && confirmed.length > 0 && hasHostBank;
      const transferred = Boolean(m.transfer_confirmed_at);

      return { memorial: m, amount, netAmount, confirmed: confirmed.length, failedPrints, ceremonyReached, hasHostBank, ready, transferred };
    })
    .filter((row) => row.memorial.funeral_status === "active" || row.amount > 0)
    .sort((a, b) => Number(b.ready) - Number(a.ready) || Number(b.ceremonyReached) - Number(a.ceremonyReached));
}

export default async function CenterTransfersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: routeKey } = await params;
  const center = await getCenterByRouteKey(routeKey);
  if (!center) redirect("/dashboard/center");
  const id = center.id;
  const centerRouteKey = getCenterRouteKey(center);
  const access = await getCenterAccess(id);
  if (!access.allowed) redirect("/dashboard/center");

  const centerName = center.name ?? "ศูนย์บริหาร";
  const rows = await getTransfers(id);
  const readyCount = rows.filter((r) => r.ready).length;
  const transferredCount = rows.filter((r) => r.transferred).length;
  const totalNet = rows.filter((r) => r.memorial.funeral_status === "active").reduce((sum, r) => sum + r.netAmount, 0);

  return (
    <div className="min-h-screen">
      <IosPageHeader
        title="โอนเงินเจ้าภาพ"
        subtitle={access.user ? `${centerName} · ${roleLabel(access.role)} · ${access.user.display_name}` : centerName}
        backHref={`/dashboard/center/${centerRouteKey}`}
      />

      <main className="max-w-lg mx-auto px-4 py-5 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Kpi icon={CheckCircle2} label="พร้อมโอน" value={`${readyCount}`} tone="emerald" />
          <Kpi icon={Banknote} label="โอนแล้ว" value={`${transferredCount}`} tone="emerald" />
          <Kpi icon={Banknote} label="ยอด active" value={`${totalNet.toLocaleString()}`} tone="amber" />
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <p className="text-[11px] font-semibold text-amber-800">หลักการทำงาน</p>
          <p className="text-[10px] text-amber-700 mt-0.5">ตรวจยอดรวมและป้ายให้ครบก่อน แล้วกดเข้าไปปิดงานในหน้ารายละเอียดงาน ระบบไม่โอนเงินอัตโนมัติ</p>
        </div>

        {rows.length === 0 ? (
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-10 text-center">
            <p className="text-sm text-gold-400">ยังไม่มีรายการสำหรับโอนเงินเจ้าภาพ</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((row) => (
              <Link
                key={row.memorial.id}
                href={`/dashboard/center/${centerRouteKey}/memorial/${row.memorial.id}`}
                className={`block rounded-2xl gold-border px-4 py-3 hover:bg-cream-100 transition-colors ${row.transferred ? "bg-blue-50" : row.ready ? "bg-emerald-50" : "bg-cream-50"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gold-800 truncate">{row.memorial.name}</p>
                      {row.transferred && <span className="text-[9px] font-bold text-blue-700 bg-white/70 rounded-full px-2 py-0.5">โอนแล้ว ✓</span>}
                      {!row.transferred && row.ready && <span className="text-[9px] font-bold text-emerald-700 bg-white/70 rounded-full px-2 py-0.5">พร้อม</span>}
                    </div>
                    <p className="text-[10px] text-gold-500">ฌาปนกิจ {formatThaiDate(row.memorial.ceremony_date)}</p>
                    <p className="text-[10px] text-gold-400 truncate">เจ้าภาพ: {row.memorial.host_name || "-"}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                </div>

                <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                  <Mini icon={Users} label="ราย" value={row.confirmed.toLocaleString()} />
                  <Mini icon={Banknote} label="สุทธิ" value={row.netAmount.toLocaleString()} />
                  <Mini icon={AlertTriangle} label="พิมพ์พลาด" value={`${row.failedPrints} ป้าย`} warning={row.failedPrints > 0} />
                  <Mini icon={Clock} label="บัญชี" value={row.hasHostBank ? "มี" : "ไม่มี"} warning={!row.hasHostBank} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: React.ElementType;
  label: string;
  tone: "amber" | "emerald";
  value: string;
}) {
  const color = tone === "emerald" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600";

  return (
    <div className="bg-cream-50 rounded-xl gold-border card-shadow px-3 py-3 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-base font-bold text-gold-800 truncate">{value}</p>
        <p className="text-[10px] text-gold-500">{label}</p>
      </div>
    </div>
  );
}

function Mini({
  icon: Icon,
  label,
  value,
  warning,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <div className={`rounded-lg py-1.5 px-1 ${warning ? "bg-amber-100" : "bg-white/70"}`}>
      <Icon className={`w-3 h-3 mx-auto mb-0.5 ${warning ? "text-amber-600" : "text-gold-500"}`} />
      <p className={`text-[11px] font-bold ${warning ? "text-amber-700" : "text-gold-800"}`}>{value}</p>
      <p className={`text-[9px] ${warning ? "text-amber-600" : "text-gold-500"}`}>{label}</p>
    </div>
  );
}
