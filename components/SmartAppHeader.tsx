"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CreditCard, Heart, Home, LayoutDashboard, Tag } from "lucide-react";
import LotusIcon from "./LotusIcon";

const NAV_ITEMS = [
  {
    label: "หน้าแรก",
    href: "/evt-2026-rra8",
    icon: Home,
    isActive: (pathname: string) => pathname === "/evt-2026-rra8",
  },
  {
    label: "ชำระเงิน",
    href: "/evt-2026-rra8/payment",
    icon: CreditCard,
    isActive: (pathname: string) => pathname === "/evt-2026-rra8/payment",
  },
  {
    label: "กรอกชื่อ",
    href: "/evt-2026-rra8/print-name",
    icon: Tag,
    isActive: (pathname: string) => pathname === "/evt-2026-rra8/print-name",
  },
  {
    label: "ขอบคุณ",
    href: "/evt-2026-rra8/ecard",
    icon: Heart,
    isActive: (pathname: string) => pathname === "/evt-2026-rra8/ecard",
  },
  {
    label: "แดชบอร์ด",
    href: "/dashboard",
    icon: LayoutDashboard,
    isActive: (pathname: string) => pathname === "/dashboard",
  },
];

export default function SmartAppHeader() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const hiddenRef = useRef(false);
  const tickingRef = useRef(false);

  useEffect(() => {
    function updateHeaderVisibility() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const viewportHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const atTop = scrollTop <= 8;
      const atBottom = scrollTop + viewportHeight >= documentHeight - 8;
      const nextHidden = !(atTop || atBottom);

      if (hiddenRef.current !== nextHidden) {
        hiddenRef.current = nextHidden;
        setHidden(nextHidden);
      }

      tickingRef.current = false;
    }

    function onScrollOrResize() {
      if (tickingRef.current) return;
      tickingRef.current = true;
      window.requestAnimationFrame(updateHeaderVisibility);
    }

    updateHeaderVisibility();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b border-gold-200 bg-white/95 shadow-[0_8px_28px_rgba(176,120,32,0.10)] backdrop-blur-md transition-transform duration-500 ease-out will-change-transform ${
          hidden ? "-translate-y-full" : "translate-y-0"
        }`}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-center px-4 sm:h-16 sm:px-6">
          <Link href="/evt-2026-rra8" className="flex items-center gap-3" aria-label="หรีดร่วมบุญ Zero Waste">
            <LotusIcon className="h-6 w-6 text-gold-600 sm:h-7 sm:w-7" />
            <div className="text-center leading-none">
              <p className="text-[17px] font-bold text-gold-900 sm:text-xl">หรีดร่วมบุญ</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.2em] text-gold-500 sm:text-xs">
                Zero Waste
              </p>
            </div>
            <LotusIcon className="h-6 w-6 scale-x-[-1] text-gold-600 sm:h-7 sm:w-7" />
          </Link>
        </div>
      </header>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-gold-200 bg-white/95 shadow-[0_-8px_28px_rgba(176,120,32,0.10)] backdrop-blur-md"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto w-full max-w-6xl overflow-x-auto px-3 py-2 sm:px-6">
          <div className="flex min-w-max items-center gap-2 sm:min-w-0 sm:justify-center">
            {NAV_ITEMS.map((item) => {
              const active = item.isActive(pathname);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border px-4 text-sm font-bold transition-colors sm:min-w-28 ${
                    active
                      ? "border-gold-500 bg-gold-100 text-gold-900 shadow-sm"
                      : "border-gold-200/70 bg-white/65 text-gold-700 hover:border-gold-300 hover:bg-white/90"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-gold-700" : "text-gold-500"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
