import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  UserRound,
} from "lucide-react";
import LotusIcon from "@/components/LotusIcon";
import SiteFooter from "@/components/SiteFooter";
import DynamicVirtualBoard from "@/components/DynamicVirtualBoard";
import { getActiveMemorials, getRecentBoardDonations } from "@/lib/memorial";

export const dynamic = "force-dynamic";

function formatDisplayDate(value: string | null) {
  if (!value) return "ยังไม่ระบุวันที่";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "ยังไม่ระบุวันที่";
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default async function Home() {
  const [activeMemorials, boardDonations] = await Promise.all([
    getActiveMemorials(),
    getRecentBoardDonations(8),
  ]);

  return (
    <main className="min-h-screen overflow-hidden">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3" aria-label="หรีดร่วมบุญ">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold-300/40 bg-white/70 shadow-sm">
            <LotusIcon className="h-6 w-6 text-gold-500" />
          </span>
          <span>
            <span className="block text-base font-bold text-gold-900">หรีดร่วมบุญ</span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-500">
              Zero Waste
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="rounded-full bg-gold-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gold-800"
          >
            เข้าใช้งาน
          </Link>
        </nav>
      </header>

      <section id="active-memorials" className="bg-white/55">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold-500">Active memorials</p>
              <h1 className="mt-2 text-3xl font-bold text-gold-900">งานศพที่เปิดอยู่ขณะนี้</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-gold-800/85">
                เลือกงานที่ต้องการเพื่อเข้าสู่หน้าผู้วายชนม์และร่วมบุญได้ถูกงาน
              </p>
            </div>
            <span className="inline-flex w-fit rounded-full bg-gold-100 px-4 py-2 text-sm font-bold text-gold-800">
              เปิดอยู่ {activeMemorials.length} งาน
            </span>
          </div>

          {activeMemorials.length > 0 ? (
            <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {activeMemorials.map((memorial) => {
                const location = [memorial.ceremony_location, memorial.ceremony_hall]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <Link
                    key={memorial.id}
                    href={`/${memorial.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gold-300/45 bg-white/80 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:shadow-gold-900/10"
                  >
                    <div className="flex gap-4 p-4">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-gold-200 bg-gold-50">
                        {memorial.photo_url ? (
                          <Image
                            src={memorial.photo_url}
                            alt={memorial.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gold-500">
                            <UserRound className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gold-500">หน้ารำลึกผู้วายชนม์</p>
                        <h3 className="mt-1 line-clamp-2 text-xl font-bold leading-snug text-gold-900">
                          {memorial.name}
                        </h3>
                        <div className="mt-3 space-y-1.5 text-sm leading-5 text-gold-800/80">
                          <p className="flex gap-2">
                            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
                            <span>{formatDisplayDate(memorial.ceremony_date)}</span>
                          </p>
                          {location && (
                            <p className="flex gap-2">
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
                              <span className="line-clamp-2">{location}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-auto flex items-center justify-between border-t border-gold-200/70 px-4 py-3 text-sm font-bold text-gold-700">
                      <span>เข้าสู่หน้างาน</span>
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mt-7 rounded-2xl border border-gold-300/45 bg-white/75 p-6 text-center shadow-sm">
              <LotusIcon className="mx-auto h-10 w-10 text-gold-400" />
              <h3 className="mt-3 text-xl font-bold text-gold-900">ขณะนี้ยังไม่มีงานศพที่เปิดอยู่</h3>
              <p className="mt-2 text-sm leading-6 text-gold-700">
                เมื่องานใหม่ถูกเปิดโดยศูนย์บริหาร ลิงก์หน้าผู้วายชนม์จะแสดงในส่วนนี้โดยอัตโนมัติ
              </p>
            </div>
          )}
        </div>
      </section>

      <section id="board" className="bg-cream-50/60">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold-500">Remembrance board</p>
            <h2 className="mt-2 text-2xl font-bold text-gold-900">บอร์ดรำลึก · ผู้ร่วมบุญ</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-7 text-gold-800/85">
              รายชื่อผู้ร่วมมอบหรีดร่วมบุญจากทุกงาน — แตะที่ป้ายเพื่อดูข้อความอาลัย/กำลังใจที่ฝากไว้
            </p>
          </div>
          <div className="mt-6">
            <DynamicVirtualBoard donations={boardDonations} />
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
