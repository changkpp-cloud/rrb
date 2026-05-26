"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Building2, ScrollText, Leaf, Users, Map, LogOut } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";

const NAV = [
  { href: "/dashboard/admin/overview",  label: "ภาพรวม",  icon: LayoutDashboard },
  { href: "/dashboard/admin/report",    label: "รายภูมิภาค", icon: Map },
  { href: "/dashboard/admin/centers",   label: "ศูนย์",    icon: Building2 },
  { href: "/dashboard/admin/memorials", label: "งานศพ",   icon: ScrollText },
  { href: "/dashboard/admin/esg",       label: "ESG",      icon: Leaf },
  { href: "/dashboard/admin/hosts",     label: "เจ้าภาพ", icon: Users },
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
      <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LotusIcon className="w-5 h-5 text-gold-600" />
          <div>
            <p className="text-sm font-bold gold-gradient-text">ESG Admin</p>
            <p className="text-[9px] text-gold-500 -mt-0.5">หรีดร่วมบุญ · ส่วนกลาง</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1 text-[11px] text-gold-400 hover:text-gold-600 transition-colors px-2 py-1"
        >
          <LogOut className="w-3.5 h-3.5" />
          ออก
        </button>
      </div>
      <div className="max-w-4xl mx-auto px-2 flex overflow-x-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                active
                  ? "border-gold-600 text-gold-700"
                  : "border-transparent text-gold-400 hover:text-gold-600"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
