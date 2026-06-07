import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  HeartHandshake,
  Leaf,
  MapPin,
  QrCode,
  ShieldCheck,
  Sprout,
  UserRound,
} from "lucide-react";
import LotusIcon from "@/components/LotusIcon";
import { getActiveMemorials } from "@/lib/memorial";

export const dynamic = "force-dynamic";

const benefits = [
  {
    icon: HeartHandshake,
    title: "ช่วยเจ้าภาพอย่างเป็นรูปธรรม",
    text: "เงินร่วมบุญถูกจัดการผ่านศูนย์บริหาร พร้อมสรุปยอดและนำส่งให้เจ้าภาพอย่างตรวจสอบได้",
  },
  {
    icon: Sprout,
    title: "ลดขยะจากพวงหรีดเดิม",
    text: "เปลี่ยนดอกไม้สด โฟม และพลาสติกใช้ครั้งเดียว เป็นบอร์ดหรีดร่วมบุญที่นำกลับมาใช้ซ้ำ",
  },
  {
    icon: BarChart3,
    title: "มีข้อมูล Impact Report",
    text: "ศูนย์และผู้ดูแลส่วนกลางดูจำนวนงาน รายชื่อ ยอดเงิน และข้อมูลลดขยะเพื่อรายงาน ESG ได้",
  },
];

const steps = [
  "ศูนย์บริหารเปิดงานและสร้าง QR / ลิงก์ประจำงาน",
  "ผู้ร่วมงานสแกน QR หรือเปิดลิงก์เฉพาะงานศพ",
  "โอนเงิน แนบสลิป และกรอกชื่อพร้อมข้อความอาลัย",
  "ศูนย์ตรวจสอบรายการ พิมพ์ป้าย และติดบนบอร์ดหรีดร่วมบุญ",
];

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
  const activeMemorials = await getActiveMemorials();

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
            href="/dashboard/center"
            className="hidden rounded-full border border-gold-300/50 bg-white/60 px-4 py-2 text-sm font-semibold text-gold-800 shadow-sm transition hover:bg-white sm:inline-flex"
          >
            ศูนย์บริหาร
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full bg-gold-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gold-800"
          >
            เข้าใช้งาน
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pb-12 pt-6 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:pb-20 lg:pt-10">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-gold-300/50 bg-white/60 px-4 py-2 text-sm font-semibold text-gold-700 shadow-sm">
            แพลตฟอร์ม Phygital ESG สำหรับงานศพไทย
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight text-gold-900 sm:text-5xl lg:text-6xl">
            หรีดร่วมบุญ
            <span className="mt-2 block text-3xl text-gold-600 sm:text-4xl lg:text-5xl">
              เปลี่ยนพวงหรีดให้เป็นบุญที่วัดผลได้
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-gold-800/90">
            เรารักษาความหมายของการแสดงความอาลัยไว้เหมือนเดิม แต่เปลี่ยนผลลัพธ์จากพวงหรีดที่กลายเป็นขยะ
            ให้เป็นเงินช่วยเจ้าภาพ ป้ายแสดงความอาลัยบนบอร์ดใช้ซ้ำ และข้อมูลลดขยะสำหรับรายงานผลกระทบ
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="#active-memorials"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gold-700 px-6 py-3 text-base font-bold text-white shadow-lg shadow-gold-900/10 transition hover:bg-gold-800"
            >
              ดูงานที่เปิดอยู่
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/center"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-gold-300/70 bg-white/70 px-6 py-3 text-base font-bold text-gold-800 shadow-sm transition hover:bg-white"
            >
              สำหรับศูนย์บริหาร
            </Link>
          </div>
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-gold-300/40 bg-white/55 p-4 text-sm leading-6 text-gold-800">
            <QrCode className="mt-1 h-5 w-5 shrink-0 text-gold-600" />
            <p>
              ผู้ร่วมบุญสามารถเลือกงานที่เปิดอยู่จากหน้าแรก หรือเข้าจาก QR Code / ลิงก์เฉพาะงานศพของแต่ละศูนย์
              เพื่อให้ข้อมูลและยอดเงินถูกผูกกับงานที่ถูกต้อง
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-[32px] border border-gold-300/40 bg-white/65 p-3 shadow-2xl shadow-gold-900/10">
            <Image
              src="/img/บอร์ด2.png"
              alt="บอร์ดหรีดร่วมบุญสำหรับติดป้ายแสดงความอาลัย"
              width={960}
              height={960}
              priority
              className="aspect-[4/5] w-full rounded-[24px] object-cover"
            />
          </div>
          <div className="absolute -bottom-5 left-5 right-5 rounded-2xl border border-gold-300/50 bg-white/90 p-4 shadow-xl shadow-gold-900/10 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-100 text-gold-700">
                <Leaf className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-gold-900">พวงหรีดเดิมตอบโจทย์ใจ</p>
                <p className="text-sm text-gold-700">หรีดร่วมบุญเพิ่มการช่วยเหลือ ลดขยะ และวัดผลได้</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="active-memorials" className="border-y border-gold-200/70 bg-white/55">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold-500">Active memorials</p>
              <h2 className="mt-2 text-3xl font-bold text-gold-900">งานศพที่เปิดรับหรีดร่วมบุญอยู่</h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-gold-800/85">
                หากมีหลายงานเปิดพร้อมกัน ระบบจะแสดงทุกงานที่ยังมีสถานะเปิดอยู่ เพื่อให้ผู้ร่วมบุญเลือกเข้าสู่หน้าผู้วายชนม์ได้ถูกงาน
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

      <section className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-12 sm:px-6 md:grid-cols-3">
        {benefits.map((item) => {
          const Icon = item.icon;
          return (
            <article
              key={item.title}
              className="rounded-2xl border border-gold-300/45 bg-white/70 p-5 shadow-sm"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-gold-100 text-gold-700">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-gold-900">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-gold-800/85">{item.text}</p>
            </article>
          );
        })}
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold-500">How it works</p>
          <h2 className="mt-3 text-3xl font-bold text-gold-900">จาก QR ประจำงาน สู่ป้ายอาลัยบนบอร์ดใช้ซ้ำ</h2>
          <p className="mt-4 text-base leading-7 text-gold-800/90">
            หน้าแรกนี้ทำหน้าที่อธิบายบริษัทและโครงการ พร้อมแสดงงานที่เปิดอยู่ ส่วนการร่วมบุญจริงจะเกิดในหน้าผู้วายชนม์ของแต่ละงาน
            เพื่อความถูกต้องของรายชื่อ สลิป ยอดเงิน และสถานะป้าย
          </p>
        </div>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={step}
              className="flex gap-4 rounded-2xl border border-gold-300/40 bg-white/65 p-4 shadow-sm"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-700 text-sm font-bold text-white">
                {index + 1}
              </span>
              <p className="pt-1 text-base font-medium leading-7 text-gold-900">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gold-900 px-4 py-14 text-white sm:px-6">
        <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold-200">For organizations</p>
            <h2 className="mt-3 text-3xl font-bold">ระบบเดียวสำหรับเจ้าภาพ ศูนย์บริหาร และรายงาน ESG</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Dashboard เจ้าภาพ", "ดูรายชื่อ ยอดเงิน สถานะสลิป และสถานะป้าย"],
              ["Dashboard ศูนย์", "เปิดงาน ตรวจสลิป จัดคิวพิมพ์ และปิดยอด"],
              ["ESG / Admin", "ดูภาพรวมรายศูนย์ พื้นที่ ช่วงเวลา และรายงานผลกระทบ"],
              ["Audit Log", "เก็บประวัติการทำงานเพื่อความโปร่งใสของระบบ"],
            ].map(([title, text]) => (
              <div key={title} className="rounded-2xl border border-white/15 bg-white/8 p-4">
                <CheckCircle2 className="mb-3 h-5 w-5 text-gold-200" />
                <h3 className="font-bold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-gold-100/85">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-3 md:grid-cols-3">
          <Link
            href="/dashboard/center"
            className="group flex items-center justify-between rounded-2xl border border-gold-300/45 bg-white/70 p-5 shadow-sm transition hover:bg-white"
          >
            <span className="flex items-center gap-3 font-bold text-gold-900">
              <Building2 className="h-5 w-5 text-gold-600" />
              ศูนย์บริหาร
            </span>
            <ArrowRight className="h-4 w-4 text-gold-500 transition group-hover:translate-x-1" />
          </Link>
          <Link
            href="/dashboard/host"
            className="group flex items-center justify-between rounded-2xl border border-gold-300/45 bg-white/70 p-5 shadow-sm transition hover:bg-white"
          >
            <span className="flex items-center gap-3 font-bold text-gold-900">
              <HeartHandshake className="h-5 w-5 text-gold-600" />
              เจ้าภาพ
            </span>
            <ArrowRight className="h-4 w-4 text-gold-500 transition group-hover:translate-x-1" />
          </Link>
          <Link
            href="/dashboard/admin"
            className="group flex items-center justify-between rounded-2xl border border-gold-300/45 bg-white/70 p-5 shadow-sm transition hover:bg-white"
          >
            <span className="flex items-center gap-3 font-bold text-gold-900">
              <ShieldCheck className="h-5 w-5 text-gold-600" />
              ผู้ดูแลระบบ
            </span>
            <ArrowRight className="h-4 w-4 text-gold-500 transition group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </main>
  );
}
