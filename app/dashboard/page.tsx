import Link from "next/link";
import { ArrowLeft, Users, Landmark, FileCheck, Settings } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";
import { getMemorial } from "@/lib/memorial";

export const revalidate = 60;

export default async function DashboardPage() {
  const memorial = await getMemorial();

  return (
    <div
      className="min-h-screen"
      style={{ background: "radial-gradient(ellipse 110% 40% at 50% -5%,rgba(245,222,170,0.32) 0%,transparent 100%),linear-gradient(180deg,#FFF8F1 0%,#F7F3EA 35%,#F1E6DC 65%,#F7F3EA 85%,#FFF8F1 100%)" }}
    >
      <header className="sticky top-0 z-40 bg-cream-100/95 backdrop-blur-sm border-b border-gold-200">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-between">
          <Link
            href="/"
            className="w-8 h-8 rounded-full border border-gold-300 bg-cream-50 flex items-center justify-center text-gold-600 hover:bg-gold-50 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <LotusIcon className="w-5 h-5 text-gold-600" />
            <div className="text-center">
              <p className="text-sm font-bold gold-gradient-text tracking-wide">แดชบอร์ดเจ้าภาพ</p>
              <p className="text-[9px] text-gold-500 tracking-widest uppercase -mt-0.5">Dashboard</p>
            </div>
            <LotusIcon className="w-5 h-5 text-gold-600 scale-x-[-1]" />
          </div>
          <div className="w-8" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-4">

        <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-4 text-center">
          <p className="text-sm text-gold-600 mb-0.5">ยินดีต้อนรับ</p>
          <p className="text-base font-bold text-gold-800">จัดการงานหรีดร่วมบุญ</p>
          <p className="text-xs text-gold-500 mt-1">{memorial.name}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MenuCard
            icon={<Users className="w-6 h-6" />}
            label="รายชื่อผู้ร่วมบุญ"
            sub="จัดการและยืนยันสลิป"
            href="/dashboard/donors"
          />
          <MenuCard
            icon={<Landmark className="w-6 h-6" />}
            label="ข้อมูลธนาคาร"
            sub="แก้ไขบัญชีรับเงิน"
            href="/dashboard/bank"
          />
          <MenuCard
            icon={<FileCheck className="w-6 h-6" />}
            label="ยืนยันสลิป"
            sub="ตรวจสอบการโอน"
            href="/dashboard/slips"
          />
          <MenuCard
            icon={<Settings className="w-6 h-6" />}
            label="ตั้งค่างาน"
            sub="แก้ไขข้อมูลผู้วายชนม์"
            href="/dashboard/settings"
          />
        </div>

        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-gold-300 bg-cream-50 text-gold-700 font-medium text-sm hover:bg-cream-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับหน้าหลัก
        </Link>
      </main>
    </div>
  );
}

function MenuCard({
  icon,
  label,
  sub,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 flex flex-col gap-2 hover:bg-cream-100 active:scale-[0.97] transition-all duration-150"
    >
      <div className="w-10 h-10 rounded-xl bg-gold-50 border border-gold-200 flex items-center justify-center text-gold-600">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-gold-800 leading-tight">{label}</p>
        <p className="text-[11px] text-gold-500 mt-0.5">{sub}</p>
      </div>
    </Link>
  );
}
