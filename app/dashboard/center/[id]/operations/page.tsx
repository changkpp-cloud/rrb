import Link from "next/link";
import { redirect } from "next/navigation";
import IosPageHeader from "@/components/IosPageHeader";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCenterByRouteKey, getCenterRouteKey } from "@/lib/center-route";
import { getCenterAccess, roleLabel } from "@/lib/iam";
import { formatThaiDate } from "@/lib/memorial";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  Printer,
} from "lucide-react";

export const revalidate = 30;

type MemorialRow = {
  id: string;
  name: string;
  ceremony_date: string;
  funeral_status: "draft" | "active" | "closed";
  center_id: string | null;
  ceremony_location: string | null;
};

type DonationRow = {
  id: string;
  memorial_id: string;
  donor_name: string;
  amount: number | null;
  slip_url: string | null;
  slip_duplicate_warning?: boolean | null;
  status: string;
  nameplate_status: "pending" | "queued" | "printed" | "posted";
  created_at: string;
};

async function getOperations(centerId: string) {
  const supabase = createAdminClient();
  const { data: memorialsData } = await supabase
    .from("memorials")
    .select("id, name, ceremony_date, funeral_status, center_id, ceremony_location")
    .eq("center_id", centerId)
    .order("ceremony_date", { ascending: true });
  const memorials = ((memorialsData ?? []) as MemorialRow[]).filter((m) => m.center_id === centerId);
  const memorialIds = new Set(memorials.map((m) => m.id));
  const { data: donationsData } = memorials.length > 0
    ? await supabase
        .from("donations")
        .select("id, memorial_id, donor_name, amount, slip_url, slip_duplicate_warning, status, nameplate_status, created_at")
        .in("memorial_id", [...memorialIds])
        .order("created_at", { ascending: false })
        .limit(1000)
    : { data: [] };
  const donations = (donationsData ?? []) as DonationRow[];
  const memorialMap = new Map(memorials.map((m) => [m.id, m]));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const slipEvidence = donations
    .filter((d) => d.slip_url && d.slip_duplicate_warning)
    .map((d) => ({ donation: d, memorial: memorialMap.get(d.memorial_id)! }))
    .filter((row) => row.memorial)
    .slice(0, 20);

  const nameplateQueue = donations
    .filter((d) => d.status === "confirmed" && d.nameplate_status !== "posted")
    .map((d) => ({ donation: d, memorial: memorialMap.get(d.memorial_id)! }))
    .filter((row) => row.memorial)
    .sort((a, b) => a.donation.created_at.localeCompare(b.donation.created_at))
    .slice(0, 20);

  const donationsByMemorial = new Map<string, DonationRow[]>();
  for (const d of donations) {
    const rows = donationsByMemorial.get(d.memorial_id) ?? [];
    rows.push(d);
    donationsByMemorial.set(d.memorial_id, rows);
  }

  const closeCandidates = memorials
    .filter((m) => m.funeral_status === "active" && new Date(m.ceremony_date) <= today)
    .map((m) => {
      const rows = donationsByMemorial.get(m.id) ?? [];
      const confirmed = rows.filter((d) => d.status === "confirmed");
      const unposted = confirmed.filter((d) => d.nameplate_status !== "posted").length;
      const amount = confirmed.reduce((sum, d) => sum + (d.amount ?? 0), 0);
      return { memorial: m, confirmed: confirmed.length, unposted, amount };
    })
    .sort((a, b) => a.unposted - b.unposted)
    .slice(0, 20);

  return {
    slipEvidence,
    nameplateQueue,
    closeCandidates,
    kpi: {
      slipEvidence: slipEvidence.length,
      nameplateQueue: nameplateQueue.length,
      closeCandidates: closeCandidates.length,
      activeMemorials: memorials.filter((m) => m.funeral_status === "active").length,
    },
  };
}

export default async function CenterOperationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: routeKey } = await params;
  const center = await getCenterByRouteKey(routeKey);
  if (!center) redirect("/dashboard/center");
  const id = center.id;
  const centerRouteKey = getCenterRouteKey(center);
  const access = await getCenterAccess(id);
  if (!access.allowed) redirect("/dashboard/center");

  const centerName = center.name ?? "ศูนย์บริหาร";
  const data = await getOperations(id);

  return (
    <div className="min-h-screen">
      <IosPageHeader
        title="งานวันนี้"
        subtitle={access.user ? `${centerName} · ${roleLabel(access.role)} · ${access.user.display_name}` : centerName}
        backHref={`/dashboard/center/${centerRouteKey}`}
      />

      <main className="max-w-lg mx-auto px-4 py-5 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Kpi icon={FileText} label="แจ้งเตือนสลิป" value={data.kpi.slipEvidence.toLocaleString()} tone="amber" />
          <Kpi icon={Printer} label="ป้ายค้าง" value={data.kpi.nameplateQueue.toLocaleString()} tone="blue" />
          <Kpi icon={ClipboardList} label="ควรเตรียมปิด" value={data.kpi.closeCandidates.toLocaleString()} tone="emerald" />
          <Kpi icon={CheckCircle2} label="งาน active" value={data.kpi.activeMemorials.toLocaleString()} tone="gold" />
        </div>

        <Queue title="แจ้งเตือนสลิปย้อนหลัง" hint="สลิปซ้ำหรือรายการที่ควรดูภายหลัง ไม่ใช่คิวอนุมัติ" empty="ไม่มีแจ้งเตือนสลิป" icon={FileText}>
          {data.slipEvidence.map(({ donation, memorial }) => (
            <OperationLink key={donation.id} href={`/dashboard/center/${centerRouteKey}/memorial/${memorial.id}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gold-800 truncate">{donation.donor_name}</p>
                <p className="text-[10px] text-gold-500 truncate">{memorial.name} · {donation.amount?.toLocaleString() ?? 0} บาท</p>
                <p className="text-[10px] text-amber-600">มีสลิปแนบไว้เป็นหลักฐาน · {new Date(donation.created_at).toLocaleString("th-TH")}</p>
              </div>
            </OperationLink>
          ))}
        </Queue>

        <Queue title="คิวป้ายรอพิมพ์/ติดบอร์ด" hint="รายการ confirmed ที่ยังไม่ได้ posted" empty="ไม่มีคิวป้ายค้าง" icon={Printer}>
          {data.nameplateQueue.map(({ donation, memorial }) => (
            <OperationLink key={donation.id} href={`/dashboard/center/${centerRouteKey}/memorial/${memorial.id}`}>
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Printer className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gold-800 truncate">{donation.donor_name}</p>
                <p className="text-[10px] text-gold-500 truncate">{memorial.name}</p>
                <p className="text-[10px] text-blue-600">สถานะป้าย: {nameplateLabel(donation.nameplate_status)}</p>
              </div>
            </OperationLink>
          ))}
        </Queue>

        <Queue title="งานที่ควรเตรียมปิด" hint="พิธีถึงวันแล้ว ตรวจยอดรวมและป้ายค้างก่อนปิดงาน" empty="ยังไม่มีงานที่ถึงรอบปิด" icon={CheckCircle2}>
          {data.closeCandidates.map(({ memorial, confirmed, amount, unposted }) => (
            <Link
              key={memorial.id}
              href={`/dashboard/center/${centerRouteKey}/memorial/${memorial.id}`}
              className="block bg-cream-50 rounded-xl gold-border px-4 py-3 hover:bg-cream-100 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gold-800 truncate">{memorial.name}</p>
                  <p className="text-[10px] text-gold-500">ฌาปนกิจ {formatThaiDate(memorial.ceremony_date)}</p>
                  {memorial.ceremony_location && <p className="text-[10px] text-gold-400 truncate">{memorial.ceremony_location}</p>}
                </div>
                <ChevronRight className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <Mini label="ยืนยันแล้ว" value={`${confirmed} ราย`} />
                <Mini label="ยอดรวม" value={`${amount.toLocaleString()} บาท`} />
                <Mini label="ค้าง" value={`${unposted} ป้าย`} warning={unposted > 0} />
              </div>
            </Link>
          ))}
        </Queue>

        <div className="h-2" />
      </main>
    </div>
  );
}

function nameplateLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "รอจัดคิว",
    queued: "เข้าคิวพิมพ์",
    printed: "พิมพ์แล้ว",
    posted: "ติดบอร์ดแล้ว",
  };
  return labels[status] ?? status;
}

function OperationLink({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 bg-cream-50 rounded-xl gold-border px-4 py-3 hover:bg-cream-100 transition-colors">
      {children}
      <ChevronRight className="w-4 h-4 text-gold-400 shrink-0" />
    </Link>
  );
}

function Queue({
  children,
  empty,
  hint,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  empty: string;
  hint: string;
  icon: React.ElementType;
  title: string;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <section className="space-y-2">
      <div className="flex items-start gap-2">
        <Icon className="w-4 h-4 text-gold-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-gold-800">{title}</p>
          <p className="text-[10px] text-gold-500">{hint}</p>
        </div>
      </div>
      {hasChildren ? (
        <div className="space-y-2">{children}</div>
      ) : (
        <div className="bg-cream-50 rounded-xl gold-border px-4 py-6 text-center">
          <p className="text-sm text-gold-400">{empty}</p>
        </div>
      )}
    </section>
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
  tone: "amber" | "blue" | "emerald" | "gold";
  value: string;
}) {
  const color = {
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    gold: "bg-gold-100 text-gold-700",
  }[tone];

  return (
    <div className="bg-cream-50 rounded-xl gold-border card-shadow px-3 py-3 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-gold-800 leading-tight truncate">{value}</p>
        <p className="text-[10px] text-gold-500">{label}</p>
      </div>
    </div>
  );
}

function Mini({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return (
    <div className={`rounded-lg py-1.5 px-2 ${warning ? "bg-amber-50" : "bg-white/70"}`}>
      <p className={`text-[11px] font-bold ${warning ? "text-amber-700" : "text-gold-800"}`}>{value}</p>
      <p className={`text-[9px] ${warning ? "text-amber-600" : "text-gold-500"}`}>{label}</p>
    </div>
  );
}
