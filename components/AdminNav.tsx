"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  FileBarChart2,
  LayoutDashboard,
  LogOut,
  Users,
  WandSparkles,
} from "lucide-react";
import Image from "next/image";

const NAV = [
  { href: "/dashboard/admin/overview", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/dashboard/admin/centers", label: "ศูนย์", icon: Building2 },
  { href: "/dashboard/admin/users", label: "ผู้ใช้", icon: Users },
  { href: "/dashboard/admin/ai-prompts", label: "พรอมต์ AI", icon: WandSparkles },
  { href: "/dashboard/admin/system", label: "ระบบ", icon: AlertTriangle, alert: true },
  { href: "/dashboard/admin/report", label: "รายงาน", icon: FileBarChart2 },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [issueCount, setIssueCount] = useState(0);

  useEffect(() => {
    let alive = true;

    async function loadHealth() {
      try {
        const res = await fetch("/api/admin/system-health", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (alive) setIssueCount(Number(data.totalIssues ?? 0));
      } catch {
        if (alive) setIssueCount(0);
      }
    }

    loadHealth();
    const timer = window.setInterval(loadHealth, 60_000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/dashboard/admin");
  }

  return (
    <header className="sticky top-0 z-40 bg-cream-100/95 backdrop-blur-sm border-b border-gold-200">
      <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image
            src="/rrb-logo.png"
            alt="RRB"
            width={60}
            height={24}
            className="object-contain"
            style={{ height: "clamp(14px,2vw,20px)", width: "auto" }}
            unoptimized
          />
          <div>
            <p
              style={{ fontSize: "clamp(11px,1.6vw,14px)" }}
              className="font-bold gold-gradient-text leading-tight"
            >
              RRB Admin
            </p>
            <p style={{ fontSize: "clamp(8px,1vw,9px)" }} className="text-gold-500 -mt-0.5">
              หรีดร่วมบุญ · ส่วนกลาง
            </p>
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

      <div className="max-w-4xl mx-auto px-1 flex overflow-x-auto">
        {NAV.map(({ href, label, icon: Icon, alert }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`min-w-fit flex-1 flex items-center justify-center gap-1 border-b-2 transition-colors whitespace-nowrap ${
                active
                  ? "border-gold-600 text-gold-700"
                  : "border-transparent text-gold-400 hover:text-gold-600"
              }`}
              style={{
                fontSize: "clamp(9px,1.4vw,12px)",
                padding: "clamp(6px,0.8vw,10px) clamp(6px,0.8vw,10px)",
              }}
            >
              <Icon
                style={{
                  width: "clamp(11px,1.4vw,14px)",
                  height: "clamp(11px,1.4vw,14px)",
                  flexShrink: 0,
                }}
              />
              {label}
              {alert && issueCount > 0 ? (
                <span className="ml-0.5 min-w-4 rounded-full bg-red-600 px-1 text-center text-[9px] font-bold leading-4 text-white">
                  {issueCount > 99 ? "99+" : issueCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
