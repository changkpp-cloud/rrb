import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatThaiDate } from "@/lib/memorial";
import { ExternalLink, Users, Banknote, Clock, CheckCircle, XCircle } from "lucide-react";

export const revalidate = 30;

async function getMemorialDetail(id: string) {
  const supabase = createAdminClient();
  const [{ data: memorial }, { data: donations }] = await Promise.all([
    supabase.from("memorials").select("*").eq("id", id).single(),
    supabase.from("donations").select("*").eq("memorial_id", id).order("created_at", { ascending: false }),
  ]);
  if (!memorial) return null;

  let centerName: string | null = null;
  if (memorial.center_id) {
    const { data: center } = await supabase.from("centers").select("name").eq("id", memorial.center_id).single();
    centerName = center?.name ?? null;
  }

  const confirmed = donations?.filter(d => d.status === "confirmed") ?? [];
  const pending = donations?.filter(d => d.status === "pending") ?? [];
  const rejected = donations?.filter(d => d.status === "rejected") ?? [];
  const totalAmount = confirmed.reduce((s, d) => s + (d.amount || 0), 0);

  return { memorial, donations: donations ?? [], confirmed, pending, rejected, totalAmount, centerName };
}

const STATUS_LABEL: Record<string, string> = { pending: "รอตรวจ", confirmed: "ยืนยัน", rejected: "ตีกลับ" };
const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-600",
};

export default async function AdminMemorialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getMemorialDetail(id);
  if (!data) return (
    <div className="text-center py-20">
      <p className="text-gold-400 text-sm">ไม่พบข้อมูลงานศพ</p>
    </div>
  );

  const { memorial: m, donations, confirmed, pending, rejected, totalAmount, centerName } = data;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-gold-800 truncate">{m.name}</h2>
          {centerName && <p className="text-[11px] text-gold-500">{centerName}</p>}
        </div>
        {m.slug && (
          <Link href={`/${m.slug}`} target="_blank" className="flex items-center gap-1 text-[11px] text-gold-500 hover:text-gold-700">
            <ExternalLink className="w-3.5 h-3.5" />
            หน้างาน
          </Link>
        )}
      </div>

      {/* Memorial info */}
      <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3 space-y-1.5">
        <p className="text-[11px] font-semibold text-gold-700 mb-2">ข้อมูลงาน</p>
        <Row label="รหัสงาน" value={m.event_code ?? "-"} />
        <Row label="ฌาปนกิจ" value={formatThaiDate(m.ceremony_date)} />
        <Row label="สถานที่" value={m.ceremony_location || "-"} />
        {m.host_name && <Row label="เจ้าภาพ" value={m.host_name} />}
        {m.host_phone && <Row label="โทร" value={m.host_phone} />}
        {m.host_relationship && <Row label="ความสัมพันธ์" value={m.host_relationship} />}
      </div>

      {/* Financial */}
      <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3">
        <p className="text-[11px] font-semibold text-gold-700 mb-2">ยอดการเงิน</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-emerald-600">{confirmed.length}</p>
            <p className="text-[10px] text-gold-500">ยืนยัน</p>
          </div>
          <div>
            <p className="text-lg font-bold text-amber-500">{pending.length}</p>
            <p className="text-[10px] text-gold-500">รอตรวจ</p>
          </div>
          <div>
            <p className="text-lg font-bold text-red-400">{rejected.length}</p>
            <p className="text-[10px] text-gold-500">ตีกลับ</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gold-100 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-gold-600">
            <Banknote className="w-4 h-4" />
            ยอดรวม (ยืนยัน)
          </div>
          <p className="text-base font-bold text-gold-800">{totalAmount.toLocaleString()} บาท</p>
        </div>
      </div>

      {/* Host bank */}
      {(m.host_bank_name || m.host_bank_account_number) && (
        <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3 space-y-1.5">
          <p className="text-[11px] font-semibold text-gold-700 mb-1">บัญชีรับเงินเจ้าภาพ</p>
          {m.host_bank_name && <Row label="ธนาคาร" value={m.host_bank_name} />}
          {m.host_bank_account_number && <Row label="เลขบัญชี" value={m.host_bank_account_number} />}
          {m.host_bank_account_name && <Row label="ชื่อบัญชี" value={m.host_bank_account_name} />}
        </div>
      )}

      {/* Donor list */}
      <div>
        <p className="text-xs font-semibold text-gold-700 mb-2">รายชื่อผู้ร่วมบุญ ({donations.length})</p>
        {donations.length === 0 ? (
          <div className="bg-cream-50 rounded-2xl gold-border px-4 py-6 text-center">
            <p className="text-sm text-gold-400">ยังไม่มีผู้ร่วมบุญ</p>
          </div>
        ) : (
          <div className="space-y-2">
            {donations.map(d => (
              <div key={d.id} className="flex items-center justify-between bg-cream-50 rounded-xl gold-border px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gold-800 truncate">
                    {d.donor_title ? `${d.donor_title} ` : ""}{d.donor_name}
                  </p>
                  <p className="text-xs font-bold text-gold-600">{(d.amount || 0).toLocaleString()} บาท</p>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${STATUS_COLOR[d.status]}`}>
                  {STATUS_LABEL[d.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="h-2" />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[11px] text-gold-500 w-24 shrink-0">{label}</span>
      <span className="text-[11px] text-gold-800 font-medium">{value}</span>
    </div>
  );
}
