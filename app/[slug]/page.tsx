import SiteHeader from "@/components/SiteHeader";
import MemorialProfile from "@/components/MemorialProfile";
import HideFloatingBack from "@/components/HideFloatingBack";
import CeremonyInfo from "@/components/CeremonyInfo";
import HomeScrollClient from "@/components/HomeScrollClient";
import SiteFooter from "@/components/SiteFooter";
import { getMemorialBySlug } from "@/lib/memorial";

export const revalidate = 60;

export default async function SlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const memorial = await getMemorialBySlug(slug);

  if (!memorial) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#ffffff" }}>
        <p className="text-gold-400 text-sm">ไม่พบข้อมูลงานศพ</p>
      </div>
    );
  }

  const basePath = `/${slug}`;

  return (
    <div className="relative min-h-screen">
      <HideFloatingBack />
      {/* iOS 17 — clean warm gradient background */}
      <div className="fixed inset-0 z-0" aria-hidden="true">
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(170deg, #FDFAF3 0%, #F7F0E0 40%, #FAF4EB 70%, #FDFAF3 100%)",
        }} />
        {/* Soft top glow */}
        <div style={{
          position: "absolute", top: "-15%", left: "50%",
          transform: "translateX(-50%)",
          width: "160%", height: "65%",
          background: "radial-gradient(ellipse at center top, rgba(245,222,170,0.32) 0%, rgba(232,200,140,0.12) 38%, transparent 62%)",
          filter: "blur(32px)",
        }} />
        {/* Warm accent — bottom left */}
        <div style={{
          position: "absolute", bottom: "10%", left: "-10%",
          width: "60%", height: "40%",
          background: "radial-gradient(ellipse, rgba(245,222,170,0.18) 0%, transparent 60%)",
          filter: "blur(24px)",
        }} />
      </div>
      <div className="relative z-10 min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1">
          <MemorialProfile memorial={memorial} />
          <CeremonyInfo memorial={memorial} />
          <div className="mt-1">
            <HomeScrollClient basePath={basePath} />
          </div>
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
