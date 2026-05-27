import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Building2, ChevronRight, Phone, User, ShieldCheck, ShieldOff } from "lucide-react";

export const revalidate = 60;

async function getData() {
  const supabase = createAdminClient();
  const [{ data: centers }, { data: memorials }] = await Promise.all([
    supabase.from("centers").select("*").order("created_at", { ascending: true }),
    supabase.from("memorials").select("id, center_id, funeral_status"),
  ]);

  const memMap: Record<string, { total: number; active: number }> = {};
  for (const m of memorials ?? []) {
    if (!m.center_id) continue;
    if (!memMap[m.center_id]) memMap[m.center_id] = { total: 0, active: 0 };
    memMap[m.center_id].total++;
    if (m.funeral_status === "active") memMap[m.center_id].active++;
  }

  return (centers ?? []).map(c => ({
    ...c,
    totalMemorials: memMap[c.id]?.total ?? 0,
    activeMemorials: memMap[c.id]?.active ?? 0,
  }));
}

export default async function AdminUsersPage() {
  const centers = await getData();

  const withManager = centers.filter(c => c.manager_name);
  const withoutManager = centers.filter(c => !c.manager_name);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-gold-800">ผู้ใช้และสิทธิ์ในระบบ</h2>
        <p className="text-[11px] text-gold-500">กำหนดผู้จัดการศูนย์และระดับสิทธิ์การเข้าถึง</p>
      </div>

      {/* Role overview */}
      <div className="grid grid-cols-1 gap-2">
        {[
          {
            role: "Super Admin",
            desc: "เปิดศูนย์ · กำหนดผู้จัดการ · ดูทุกอย่าง · ตรวจสอบระบบ",
            color: "bg-red-50 border-red-200",
            badge: "bg-red-100 text-red-700",
            icon: ShieldCheck,
            count: "1 คน",
          },
          {
            role: "Center Manager",
            desc: "คุมศูนย์ตัวเอง · เปิด/ปิดงาน · อนุมัติสลิป · ดูเงิน",
            color: "bg-blue-50 border-blue-200",
            badge: "bg-blue-100 text-blue-700",
            icon: ShieldCheck,
            count: `${withManager.length} ศูนย์`,
          },
          {
            role: "Center Staff",
            desc: "ตรวจสลิป · พิมพ์ป้าย · อัปเดตสถานะ (สิทธิ์จำกัด)",
            color: "bg-cream-50 border-gold-200",
            badge: "bg-gold-100 text-gold-700",
            icon: ShieldOff,
            count: "เร็วๆ นี้",
          },
        ].map(({ role, desc, color, badge, icon: Icon, count }) => (
          <div key={role} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${color}`}>
            <Icon className="w-5 h-5 text-gold-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-bold text-gold-800">{role}</p>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${badge}`}>{count}</span>
              </div>
              <p className="text-[10px] text-gold-600 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Centers with managers */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gold-700">
            ผู้จัดการศูนย์ ({withManager.length} ศูนย์)
          </p>
          <Link href="/dashboard/admin/centers/new"
            className="text-[11px] text-gold-500 hover:text-gold-700 flex items-center gap-0.5">
            + เปิดศูนย์ใหม่ <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {withManager.length === 0 ? (
          <div className="bg-cream-50 rounded-xl gold-border px-4 py-5 text-center">
            <p className="text-sm text-gold-400">ยังไม่มีศูนย์ที่กำหนดผู้จัดการ</p>
          </div>
        ) : (
          <div className="space-y-2">
            {withManager.map(c => (
              <Link key={c.id} href={`/dashboard/admin/centers/${c.id}`}
                className="flex items-center gap-3 bg-cream-50 rounded-xl gold-border card-shadow px-4 py-3 hover:bg-cream-100 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gold-800 truncate">{c.manager_name}</p>
                  <p className="text-[10px] text-gold-500 truncate">{c.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {c.phone && (
                      <span className="flex items-center gap-0.5 text-[10px] text-gold-500">
                        <Phone className="w-3 h-3" />{c.phone}
                      </span>
                    )}
                    <span className="text-[10px] text-gold-500">{c.totalMemorials} งาน</span>
                    {c.activeMemorials > 0 && (
                      <span className="text-[10px] text-emerald-600">เปิด {c.activeMemorials}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${c.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    {c.status === "active" ? "ใช้งาน" : "ปิดแล้ว"}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-gold-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Centers missing managers */}
      {withoutManager.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-amber-700 mb-2">
            ⚠ ยังไม่มีผู้จัดการ ({withoutManager.length} ศูนย์)
          </p>
          <div className="space-y-2">
            {withoutManager.map(c => (
              <Link key={c.id} href={`/dashboard/admin/centers/${c.id}`}
                className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 hover:bg-amber-100 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gold-800 truncate">{c.name}</p>
                  <p className="text-[10px] text-amber-600">ยังไม่ได้กำหนดผู้จัดการ</p>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Future features note */}
      <div className="bg-cream-50 rounded-2xl gold-border px-4 py-4 space-y-2">
        <p className="text-xs font-semibold text-gold-700">แผนระบบสิทธิ์ (เร็วๆ นี้)</p>
        {[
          "เชิญผู้จัดการศูนย์ด้วยลิงก์ OTP",
          "กำหนด Center Staff พร้อม role แยกย่อย",
          "บัญชี login แยกตามระดับ (Manager / Staff / Viewer)",
          "ยืนยันตัวตนด้วยเบอร์โทร SMS",
        ].map(item => (
          <div key={item} className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-300 shrink-0" />
            <p className="text-[11px] text-gold-500">{item}</p>
          </div>
        ))}
      </div>

      <div className="h-2" />
    </div>
  );
}
