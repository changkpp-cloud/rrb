import Image from "next/image";
import SiteHeader from "@/components/SiteHeader";
import MemorialProfile from "@/components/MemorialProfile";
import CeremonyInfo from "@/components/CeremonyInfo";
import HomeScrollClient from "@/components/HomeScrollClient";
import SiteFooter from "@/components/SiteFooter";
import { getMemorial } from "@/lib/memorial";

export const revalidate = 60;

export default async function Home() {
  const memorial = await getMemorial();

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
