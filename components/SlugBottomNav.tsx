"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Banknote, Tag, Heart, LayoutDashboard } from "lucide-react";

export interface PaidData {
  memorial_id: string;
  slip_url: string;
  amount: string;
}

export function savePaidData(slug: string, data: PaidData) {
  try {
    sessionStorage.setItem(`rrb_paid_${slug}`, JSON.stringify(data));
    window.dispatchEvent(new Event("rrb-payment-done"));
  } catch {}
}

function readPaidData(slug: string): PaidData | null {
  try {
    const raw = sessionStorage.getItem(`rrb_paid_${slug}`);
    return raw ? (JSON.parse(raw) as PaidData) : null;
  } catch {
    return null;
  }
}

interface Tab {
  label: string;
  Icon: React.ElementType;
  segment: string | null;
  requiresPaid: boolean;
  getHref: (slug: string, paid: PaidData | null) => string;
}

const TABS: Tab[] = [
  {
    label: "หน้าแรก",
    Icon: Home,
    segment: null,
    requiresPaid: false,
    getHref: (slug) => `/${slug}`,
  },
  {
    label: "ชำระเงิน",
    Icon: Banknote,
    segment: "payment",
    requiresPaid: false,
    getHref: (slug) => `/${slug}/payment`,
  },
  {
    label: "กรอกชื่อ",
    Icon: Tag,
    segment: "print-name",
    requiresPaid: true,
    getHref: (slug, paid) =>
      paid
        ? `/${slug}/print-name?memorial_id=${paid.memorial_id}&slip_url=${encodeURIComponent(paid.slip_url)}&amount=${paid.amount}`
        : `/${slug}/print-name`,
  },
  {
    label: "ขอบคุณ",
    Icon: Heart,
    segment: "ecard",
    requiresPaid: true,
    getHref: (slug) => `/${slug}/ecard`,
  },
  {
    label: "แดชบอร์ด",
    Icon: LayoutDashboard,
    segment: "overview",
    requiresPaid: false,
    getHref: (slug) => `/${slug}/overview`,
  },
];

interface Props {
  slug: string;
}

export default function SlugBottomNav({ slug }: Props) {
  const pathname = usePathname();
  const [paid, setPaid] = useState<PaidData | null>(null);

  useEffect(() => {
    setPaid(readPaidData(slug));
    function onDone() {
      setPaid(readPaidData(slug));
    }
    window.addEventListener("rrb-payment-done", onDone);
    return () => window.removeEventListener("rrb-payment-done", onDone);
  }, [slug]);

  function isActive(segment: string | null) {
    if (segment === null) return pathname === `/${slug}`;
    return pathname === `/${slug}/${segment}`;
  }

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t border-gold-200 bg-white/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-lg">
        {TABS.map((tab) => {
          const active = isActive(tab.segment);
          const href = tab.getHref(slug, paid);
          const Icon = tab.Icon;

          return (
            <Link
              key={tab.label}
              href={href}
              className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 transition-colors ${
                active ? "text-gold-700" : "text-stone-400"
              }`}
            >
              {active && (
                <span className="absolute top-0 left-3 right-3 h-0.5 rounded-b-full bg-gold-500" />
              )}
              <Icon className={`h-5 w-5 ${active ? "text-gold-600" : "text-stone-400"}`} />
              <span className={`text-[10px] font-semibold leading-none ${active ? "text-gold-700" : "text-stone-400"}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
