"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CreditCard, Heart, Home, Plus, Tag } from "lucide-react";

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
    label: "ป้ายชื่อ",
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
        <div className="relative mx-auto flex h-14 w-full max-w-6xl items-center justify-center px-4 sm:h-16 sm:px-6">
          <Link href="/evt-2026-rra8" className="flex items-center gap-3" aria-label="หรีดร่วมบุญ Zero Waste">
            <Image src="/rrb-logo.webp" alt="RRB" width={120} height={40} className="h-9 w-auto object-contain" unoptimized />
            <div className="text-center leading-none">
              <p className="text-[17px] font-bold text-gold-900 sm:text-xl">หรีดร่วมบุญ</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.2em] text-gold-500 sm:text-xs">
                Zero Waste
              </p>
            </div>
          </Link>
          <Link
            href="/dashboard"
            aria-label="แดชบอร์ด"
            title="แดชบอร์ด"
            className={`absolute right-4 flex h-10 w-10 items-center justify-center rounded-full border transition-colors sm:right-6 ${
              pathname.startsWith("/dashboard")
                ? "border-gold-500 bg-gold-100 text-gold-800 shadow-sm"
                : "border-gold-200 bg-white/70 text-gold-600 hover:border-gold-300 hover:bg-white"
            }`}
          >
            <Plus className="h-5 w-5" strokeWidth={2.4} />
          </Link>
        </div>
      </header>

      <nav
        className={`fixed inset-x-0 bottom-0 z-50 border-t border-gold-200 bg-white/95 shadow-[0_-8px_28px_rgba(176,120,32,0.10)] backdrop-blur-md transition-transform duration-500 ease-out will-change-transform ${
          hidden ? "translate-y-full" : "translate-y-0"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto w-full max-w-6xl px-1.5 py-1.5 sm:px-6 sm:py-2">
          <div className="grid w-full grid-cols-4 gap-1 sm:gap-2">
            {NAV_ITEMS.map((item) => {
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
        </div>
      </nav>
    </>
  );
}
