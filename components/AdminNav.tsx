"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Building2, Users, ShieldAlert, FileBarChart2, LogOut } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";

const NAV = [
  { href: "/dashboard/admin/overview", label: "ภาพรวม",   icon: LayoutDashboard },
  { href: "/dashboard/admin/centers",  label: "ศูนย์",     icon: Building2 },
  { href: "/dashboard/admin/users",    label: "ผู้ใช้",    icon: Users },
  { href: "/dashboard/admin/audit",    label: "ตรวจสอบ",  icon: ShieldAlert },
  { href: "/dashboard/admin/report",   label: "รายงาน",   icon: FileBarChart2 },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/dashboard/admin");
  }

  return (
    <header className="sticky top-0 z-40 bg-cream-100/95 backdrop-blur-sm border-b border-gold-200">
      {/* Logo row */}
      <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LotusIcon style={{ width: "clamp(14px,2vw,20px)", height: "clamp(14px,2vw,20px)" }} className="text-gold-600" />
          <div>
            <p style={{ fontSize: "clamp(11px,1.6vw,14px)" }} className="font-bold gold-gradient-text leading-tight">ESG Admin</p>
            <p style={{ fontSize: "clamp(8px,1vw,9px)" }} className="text-gold-500 -mt-0.5">หรีดร่วมบุญ · ส่วนกลาง</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1 text-gold-400 hover:text-gold-600 transition-colors px-2 py-1"
          style={{ fontSize: "clamp(9px,1.2vw,11px)" }}
        >
          <LogOut style={{ width: "clamp(11px,1.4vw,14px)", height: "clamp(11px,1.4vw,14px)" }} />
          ออก
        </button>
      </div>

      {/* Nav tab row */}
      <div className="max-w-4xl mx-auto px-1 flex">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex items-center justify-center gap-1 border-b-2 transition-colors whitespace-nowrap ${
                active
                  ? "border-gold-600 text-gold-700"
                  : "border-transparent text-gold-400 hover:text-gold-600"
              }`}
              style={{
                fontSize: "clamp(9px,1.4vw,12px)",
                padding: "clamp(6px,0.8vw,10px) clamp(4px,0.6vw,8px)",
              }}
            >
              <Icon style={{ width: "clamp(11px,1.4vw,14px)", height: "clamp(11px,1.4vw,14px)", flexShrink: 0 }} />
              {label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
