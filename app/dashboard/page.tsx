import Link from "next/link";
import { Building2, KeyRound, BarChart3 } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="min-h-[calc(100vh-140px)] px-4">
      <div className="flex min-h-[calc(100vh-140px)] flex-col items-center justify-center">
        <div className="w-full max-w-sm space-y-5">
          <p className="text-center text-sm font-semibold text-gold-600">เลือกประเภทการเข้าสู่ระบบ</p>

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
                <p className="text-xs text-gold-500 mt-0.5 leading-relaxed">
                  เปิดงานศพ · สร้างลิงก์ · ตรวจสลิป · พิมพ์ป้าย
                </p>
              </div>
            </div>
          </Link>

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
        </div>
      </div>
    </div>
  );
}
