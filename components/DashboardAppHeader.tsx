"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Building2,
  FileBarChart2,
  Home,
  KeyRound,
  LayoutDashboard,
  LogOut,
  ShieldAlert,
  Users,
  WandSparkles,
} from "lucide-react";
import LotusIcon from "./LotusIcon";
import useRafScrollVisibility from "./useRafScrollVisibility";

const DASHBOARD_NAV = [
  { href: "/dashboard", label: "หลัก", icon: Home, isActive: (pathname: string) => pathname === "/dashboard" },
  { href: "/dashboard/center", label: "ศูนย์", icon: Building2, isActive: (pathname: string) => pathname.startsWith("/dashboard/center") },
  { href: "/dashboard/host", label: "เจ้าภาพ", icon: KeyRound, isActive: (pathname: string) => pathname.startsWith("/dashboard/host") },
  { href: "/dashboard/admin", label: "แอดมิน", icon: BarChart3, isActive: (pathname: string) => pathname.startsWith("/dashboard/admin") },
];

const ADMIN_NAV = [
  { href: "/dashboard/admin/overview", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/dashboard/admin/centers", label: "ศูนย์", icon: Building2 },
  { href: "/dashboard/admin/users", label: "ผู้ใช้", icon: Users },
  { href: "/dashboard/admin/ai-prompts", label: "AI", icon: WandSparkles },
  { href: "/dashboard/admin/audit", label: "ตรวจ", icon: ShieldAlert },
  { href: "/dashboard/admin/report", label: "รายงาน", icon: FileBarChart2 },
];

export default function DashboardAppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const hidden = useRafScrollVisibility();
  const isAdminProtected = pathname.startsWith("/dashboard/admin/") && pathname !== "/dashboard/admin";

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/dashboard/admin");
  }

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b border-gold-200 bg-white/95 shadow-[0_8px_28px_rgba(176,120,32,0.10)] backdrop-blur-md transition-transform duration-500 ease-out will-change-transform ${
          hidden ? "-translate-y-full" : "translate-y-0"
        }`}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-center px-4 sm:h-16 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-3" aria-label="หรีดร่วมบุญ Zero Waste Dashboard">
            <LotusIcon className="h-6 w-6 text-gold-600 sm:h-7 sm:w-7" />
            <div className="text-center leading-none">
              <p className="text-[17px] font-bold text-gold-900 sm:text-xl">หรีดร่วมบุญ</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.2em] text-gold-500 sm:text-xs">
                Zero Waste Dashboard
              </p>
            </div>
            <LotusIcon className="h-6 w-6 scale-x-[-1] text-gold-600 sm:h-7 sm:w-7" />
          </Link>
        </div>
      </header>

      <nav
        className={`fixed inset-x-0 bottom-0 z-50 border-t border-gold-200 bg-white/95 shadow-[0_-8px_28px_rgba(176,120,32,0.10)] backdrop-blur-md transition-transform duration-500 ease-out will-change-transform ${
          hidden ? "translate-y-full" : "translate-y-0"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label={isAdminProtected ? "Admin dashboard navigation" : "Dashboard navigation"}
      >
        <div className="mx-auto w-full max-w-6xl px-1.5 py-1.5 sm:px-6 sm:py-2">
          {isAdminProtected ? (
            <div className="grid w-full grid-cols-7 gap-1 sm:gap-2">
              {ADMIN_NAV.map((item) => {
                const active = pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-[50px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl border px-0.5 text-center text-[9px] font-bold leading-none transition-colors sm:min-h-11 sm:flex-row sm:gap-2 sm:rounded-full sm:px-3 sm:text-sm ${
                      active
                        ? "border-gold-500 bg-gold-100 text-gold-900 shadow-sm"
                        : "border-gold-200/70 bg-white/65 text-gold-700 hover:border-gold-300 hover:bg-white/90"
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4 ${active ? "text-gold-700" : "text-gold-500"}`} />
                    <span className="block max-w-full truncate">{item.label}</span>
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={logout}
                className="flex min-h-[50px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl border border-gold-200/70 bg-white/65 px-0.5 text-center text-[9px] font-bold leading-none text-gold-700 transition-colors hover:border-gold-300 hover:bg-white/90 sm:min-h-11 sm:flex-row sm:gap-2 sm:rounded-full sm:px-3 sm:text-sm"
              >
                <LogOut className="h-3.5 w-3.5 shrink-0 text-gold-500 sm:h-4 sm:w-4" />
                <span className="block max-w-full truncate">ออก</span>
              </button>
            </div>
          ) : (
            <div className="grid w-full grid-cols-4 gap-1 sm:gap-2">
              {DASHBOARD_NAV.map((item) => {
                const active = item.isActive(pathname);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-[52px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl border px-1 text-center text-[10px] font-bold leading-none transition-colors sm:min-h-11 sm:flex-row sm:gap-2 sm:rounded-full sm:px-4 sm:text-sm ${
                      active
                        ? "border-gold-500 bg-gold-100 text-gold-900 shadow-sm"
                        : "border-gold-200/70 bg-white/65 text-gold-700 hover:border-gold-300 hover:bg-white/90"
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 sm:h-4 sm:w-4 ${active ? "text-gold-700" : "text-gold-500"}`} />
                    <span className="block max-w-full truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
