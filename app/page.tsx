import { redirect } from "next/navigation";
import { getMemorial } from "@/lib/memorial";

export const dynamic = "force-dynamic";

export default async function Home() {
  const memorial = await getMemorial();

  if (!memorial?.slug) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#ffffff" }}>
        <p className="text-gold-400 text-sm">ไม่พบข้อมูลงานศพ</p>
      </div>
    );
  }

  redirect(`/${memorial.slug}`);
}
