import Link from "next/link";
import { Building2, KeyRound, BarChart3 } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <LotusIcon className="w-7 h-7 text-gold-600" />
            <div className="text-center">
              <h1 className="text-2xl font-bold gold-gradient-text tracking-wide">หรีดร่วมบุญ</h1>
              <p className="text-lg font-bold text-gold-500 uppercase leading-none">Zero Waste</p>
            </div>
            <LotusIcon className="w-7 h-7 text-gold-600 scale-x-[-1]" />
          </div>
          <p className="text-xs text-gold-500">เลือกประเภทการเข้าสู่ระบบ</p>
        </div>

        {/* Center login */}
        <Link
          href="/dashboard/center"
          className="block bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-5 hover:bg-cream-100 transition-colors active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gold-100 border border-gold-300 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-gold-600" />
            </div>
            <div>
              <p className="text-base font-bold text-gold-800">ศูนย์บริหาร</p>
              <p className="text-xs text-gold-500 mt-0.5 leading-relaxed">เปิดงานศพ · สร้างลิงก์ · ตรวจสลิป · พิมพ์ป้าย</p>
            </div>
          </div>
        </Link>

        {/* Host login */}
        <Link
          href="/dashboard/host"
          className="block bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-5 hover:bg-cream-100 transition-colors active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gold-100 border border-gold-300 flex items-center justify-center shrink-0">
              <KeyRound className="w-6 h-6 text-gold-600" />
            </div>
            <div>
              <p className="text-base font-bold text-gold-800">เจ้าภาพ</p>
              <p className="text-xs text-gold-500 mt-0.5 leading-relaxed">ดูรายชื่อผู้ร่วมบุญ · ยอดเงิน · สถานะป้าย</p>
            </div>
          </div>
        </Link>

        {/* ESG Admin login */}
        <Link
          href="/dashboard/admin"
          className="block bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-5 hover:bg-cream-100 transition-colors active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gold-100 border border-gold-300 flex items-center justify-center shrink-0">
              <BarChart3 className="w-6 h-6 text-gold-600" />
            </div>
            <div>
              <p className="text-base font-bold text-gold-800">ESG Admin</p>
              <p className="text-xs text-gold-500 mt-0.5 leading-relaxed">ภาพรวมระบบ · ศูนย์ · งานศพ · รายงาน ESG</p>
            </div>
          </div>
        </Link>

        <p className="text-center text-[11px] text-gold-300">
          หรีดร่วมบุญ Zero Waste · ลดขยะพวงหรีด เปลี่ยนเป็นบุญ
        </p>
      </div>
    </div>
  );
}
