import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import SiteHeader from "@/components/SiteHeader";
import MemorialProfile from "@/components/MemorialProfile";
import CeremonyInfo from "@/components/CeremonyInfo";
import HomeScrollClient from "@/components/HomeScrollClient";
import SiteFooter from "@/components/SiteFooter";
import type { Memorial } from "@/lib/supabase/types";

const DEMO_MEMORIAL: Memorial = {
  id: "demo",
  slug: "demo",
  name: "นางสาว สุภาพร ปทุมานนท์",
  birth_date: "1988-06-19",
  death_date: "2016-03-16",
  age: 28,
  photo_url: "/img/001.jpg",
  ceremony_date: "2016-03-20",
  ceremony_time: "",
  ceremony_location: "วัดไตรภูมิ",
  ceremony_hall: "ต.พรานกระต่าย อ.พรานกระต่าย จ.กำแพงเพชร",
  bank_name: "ธนาคารไทยพาณิชย์",
  bank_account_number: "123-4-56789-0",
  bank_account_name: "นายสมชาย ปทุมานนท์",
  bank_account_image_url: null,
  is_active: true,
  created_at: new Date().toISOString(),
};

async function getData(): Promise<Memorial> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("memorials")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    return (data as Memorial | null) ?? DEMO_MEMORIAL;
  } catch {
    return DEMO_MEMORIAL;
  }
}

export const revalidate = 60;

export default async function Home() {
  const memorial = await getData();

  return (
    <div className="relative min-h-screen">

      {/* ── Background image — วิมานสวรรค์ ── */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/img/bg-heaven.png"
          alt=""
          fill
          priority
          quality={100}
          style={{ objectFit: "cover", objectPosition: "center top" }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <SiteHeader />

        <main className="flex-1">
          <MemorialProfile memorial={memorial} />
          <CeremonyInfo memorial={memorial} />
          <div className="mt-[5px]">
            <HomeScrollClient />
          </div>
        </main>

        <SiteFooter />
      </div>

    </div>
  );
}
