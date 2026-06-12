import Link from "next/link";
import { redirect } from "next/navigation";
import IosPageHeader from "@/components/IosPageHeader";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCenterByRouteKey, getCenterRouteKey } from "@/lib/center-route";
import { getCenterAccess, roleLabel } from "@/lib/iam";
import { formatThaiDate } from "@/lib/memorial";
import { Banknote, CheckCircle2, ChevronRight, Leaf, Users } from "lucide-react";

export const revalidate = 60;

type MemorialRow = {
  id: string;
  name: string;
  ceremony_date: string;
  host_name: string | null;
};

type DonationRow = {
  memorial_id: string;
  amount: number | null;
  status: string;
};

async function getClosedMemorials(centerId: string) {
  const supabase = createAdminClient();
  const { data: memorialsData } = await supabase
    .from("memorials")
    .select("id, name, ceremony_date, host_name")
    .eq("center_id", centerId)
    .eq("funeral_status", "closed")
    .order("ceremony_date", { ascending: false });

  const memorials = (memorialsData ?? []) as MemorialRow[];
  if (memorials.length === 0) return [];

  const ids = memorials.map((m) => m.id);
  const { data: donationsData } = await supabase
    .from("donations")
    .select("memorial_id, amount, status")
    .in("memorial_id", ids);

  const donationMap = new Map<string, DonationRow[]>();
  for (const d of (donationsData ?? []) as DonationRow[]) {
    const rows = donationMap.get(d.memorial_id) ?? [];
    rows.push(d);
    donationMap.set(d.memorial_id, rows);
  }

  return memorials.map((m) => {
    const confirmed = (donationMap.get(m.id) ?? []).filter((d) => d.status === "confirmed");
    const amount = confirmed.reduce((sum, d) => sum + (d.amount ?? 0), 0);
    return { memorial: m, amount, donors: confirmed.length, wasteKg: confirmed.length * 2 };
  });
}

export default async function CenterClosedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: routeKey } = await params;
  const center = await getCenterByRouteKey(routeKey);
  if (!center) redirect("/dashboard/center");
  const id = center.id;
  const centerRouteKey = getCenterRouteKey(center);
  const access = await getCenterAccess(id);
  if (!access.allowed) redirect("/dashboard/center");

  const centerName = center.name ?? "ศูนย์บริหาร";
  const rows = await getClosedMemorials(id);
  const totals = rows.reduce(
    (sum, row) => ({
      amount: sum.amount + row.amount,
      donors: sum.donors + row.donors,
      wasteKg: sum.wasteKg + row.wasteKg,
    }),
    { amount: 0, donors: 0, wasteKg: 0 },
  );

  return (
    <div className="min-h-screen">
      <IosPageHeader
        title="งานศพที่ปิดแล้ว"
        subtitle={access.user ? `${centerName} · ${roleLabel(access.role)} · ${access.user.display_name}` : centerName}
        backHref={`/dashboard/center/${centerRouteKey}`}
      />

      <main className="max-w-lg mx-auto px-4 py-5 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Kpi icon={CheckCircle2} label="งาน" value={rows.length.toLocaleString()} />
          <Kpi icon={Users} label="ราย" value={totals.donors.toLocaleString()} />
          <Kpi icon={Leaf} label="กก." value={totals.wasteKg.toLocaleString()} />
        </div>

        {rows.length === 0 ? (
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-10 text-center">
            <p className="text-sm text-gold-400">ยังไม่มีงานศพที่ปิดแล้ว</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map(({ amount, donors, memorial, wasteKg }) => (
              <Link
                key={memorial.id}
                href={`/dashboard/center/${centerRouteKey}/memorial/${memorial.id}`}
                className="block bg-cream-50 rounded-2xl gold-border px-4 py-3 hover:bg-cream-100 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gold-800 truncate">{memorial.name}</p>
                    <p className="text-[10px] text-gold-500">ฌาปนกิจ {formatThaiDate(memorial.ceremony_date)}</p>
                    {memorial.host_name && <p className="text-[10px] text-gold-400 truncate">เจ้าภาพ: {memorial.host_name}</p>}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <Mini icon={Users} label="ผู้ร่วมบุญ" value={`${donors} ราย`} />
                  <Mini icon={Banknote} label="ยอดรวม" value={`${amount.toLocaleString()} บาท`} />
                  <Mini icon={Leaf} label="ลดขยะ" value={`${wasteKg.toLocaleString()} กก.`} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="bg-cream-50 rounded-xl gold-border card-shadow px-2 py-3 text-center">
      <Icon className="w-4 h-4 text-gold-600 mx-auto mb-1" />
      <p className="text-base font-bold text-gold-800 truncate">{value}</p>
      <p className="text-[10px] text-gold-500">{label}</p>
    </div>
  );
}

function Mini({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-lg py-1.5 px-1 bg-white/70">
      <Icon className="w-3 h-3 mx-auto mb-0.5 text-gold-500" />
      <p className="text-[11px] font-bold text-gold-800">{value}</p>
      <p className="text-[9px] text-gold-500">{label}</p>
    </div>
  );
}
