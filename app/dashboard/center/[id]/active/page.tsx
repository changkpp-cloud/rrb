import Link from "next/link";
import { redirect } from "next/navigation";
import IosPageHeader from "@/components/IosPageHeader";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCenterByRouteKey, getCenterRouteKey } from "@/lib/center-route";
import { getCenterAccess, roleLabel } from "@/lib/iam";
import { formatThaiDate } from "@/lib/memorial";
import { AlertTriangle, Banknote, ChevronRight, ScrollText, Users } from "lucide-react";

export const revalidate = 30;

type MemorialRow = {
  id: string;
  name: string;
  ceremony_date: string;
  ceremony_location: string | null;
  funeral_status: string;
};

type DonationRow = {
  memorial_id: string;
  amount: number | null;
  status: string;
  nameplate_status: string;
  slip_duplicate_warning?: boolean | null;
};

async function getActiveMemorials(centerId: string) {
  const supabase = createAdminClient();
  const { data: memorialsData } = await supabase
    .from("memorials")
    .select("id, name, ceremony_date, ceremony_location, funeral_status")
    .eq("center_id", centerId)
    .eq("funeral_status", "active")
    .order("ceremony_date", { ascending: true });

  const memorials = (memorialsData ?? []) as MemorialRow[];
  if (memorials.length === 0) return [];

  const ids = memorials.map((m) => m.id);
  const { data: donationsData } = await supabase
    .from("donations")
    .select("memorial_id, amount, status, nameplate_status, slip_duplicate_warning")
    .in("memorial_id", ids);

  const donationMap = new Map<string, DonationRow[]>();
  for (const d of (donationsData ?? []) as DonationRow[]) {
    const rows = donationMap.get(d.memorial_id) ?? [];
    rows.push(d);
    donationMap.set(d.memorial_id, rows);
  }

  return memorials.map((m) => {
    const rows = donationMap.get(m.id) ?? [];
    const confirmed = rows.filter((d) => d.status === "confirmed");
    return {
      memorial: m,
      amount: confirmed.reduce((sum, d) => sum + (d.amount ?? 0), 0),
      confirmed: confirmed.length,
      slipWarnings: rows.filter((d) => d.slip_duplicate_warning).length,
      nameplateQueue: confirmed.filter((d) => d.nameplate_status !== "posted").length,
    };
  });
}

export default async function CenterActivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: routeKey } = await params;
  const center = await getCenterByRouteKey(routeKey);
  if (!center) redirect("/dashboard/center");
  const id = center.id;
  const centerRouteKey = getCenterRouteKey(center);
  const access = await getCenterAccess(id);
  if (!access.allowed) redirect("/dashboard/center");

  const centerName = center.name ?? "ศูนย์บริหาร";
  const rows = await getActiveMemorials(id);

  return (
    <div className="min-h-screen">
      <IosPageHeader
        title="งานศพที่เปิดอยู่"
        subtitle={access.user ? `${centerName} · ${roleLabel(access.role)} · ${access.user.display_name}` : centerName}
        backHref={`/dashboard/center/${centerRouteKey}`}
      />

      <main className="max-w-lg mx-auto px-4 py-5 space-y-4">
        <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ScrollText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-gold-800">{rows.length}</p>
            <p className="text-[11px] text-gold-500">งานที่กำลังเปิดรับร่วมทำบุญและดำเนินการ</p>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-10 text-center">
            <p className="text-sm text-gold-400">ยังไม่มีงานศพที่เปิดอยู่</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map(({ amount, confirmed, memorial, nameplateQueue, slipWarnings }) => (
              <Link
                key={memorial.id}
                href={`/dashboard/center/${centerRouteKey}/memorial/${memorial.id}`}
                className="block bg-cream-50 rounded-2xl gold-border px-4 py-3 hover:bg-cream-100 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gold-800 truncate">{memorial.name}</p>
                    <p className="text-[10px] text-gold-500">ฌาปนกิจ {formatThaiDate(memorial.ceremony_date)}</p>
                    {memorial.ceremony_location && <p className="text-[10px] text-gold-400 truncate">{memorial.ceremony_location}</p>}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                </div>
                <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                  <Mini icon={Users} label="ราย" value={confirmed.toLocaleString()} />
                  <Mini icon={Banknote} label="บาท" value={amount.toLocaleString()} />
                  <Mini icon={AlertTriangle} label="สลิป" value={slipWarnings.toLocaleString()} warning={slipWarnings > 0} />
                  <Mini icon={ScrollText} label="ป้าย" value={nameplateQueue.toLocaleString()} warning={nameplateQueue > 0} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
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
    <div className={`rounded-lg py-1.5 px-1 ${warning ? "bg-amber-50" : "bg-white/70"}`}>
      <Icon className={`w-3 h-3 mx-auto mb-0.5 ${warning ? "text-amber-600" : "text-gold-500"}`} />
      <p className={`text-[11px] font-bold ${warning ? "text-amber-700" : "text-gold-800"}`}>{value}</p>
      <p className={`text-[9px] ${warning ? "text-amber-600" : "text-gold-500"}`}>{label}</p>
    </div>
  );
}
