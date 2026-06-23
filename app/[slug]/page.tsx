import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MemorialProfile from "@/components/MemorialProfile";
import HideFloatingBack from "@/components/HideFloatingBack";
import CeremonyInfo from "@/components/CeremonyInfo";
import HomeScrollClient from "@/components/HomeScrollClient";
import SiteFooter from "@/components/SiteFooter";
import { getMemorialBySlug } from "@/lib/memorial";
import { getSiteUrl } from "@/lib/site-url";
import { getSiteSettings, HOME_BOARD_IMAGE_KEY, HOME_BOARD_CAPTION_KEY } from "@/lib/site-settings";

export const revalidate = 60;

type SlugParams = { params: Promise<{ slug: string }> };

function absoluteUrl(url: string | null | undefined) {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${getSiteUrl()}${url.startsWith("/") ? "" : "/"}${url}`;
}

function formatMetadataDate(dateValue: string | null | undefined) {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function buildShareDescription(memorial: Awaited<ReturnType<typeof getMemorialBySlug>>) {
  if (!memorial) return "ร่วมอาลัย ร่วมทำบุญ ร่วมลดขยะ";

  const birthDate = formatMetadataDate(memorial.birth_date);
  const deathDate = formatMetadataDate(memorial.death_date);
  const ceremonyDate = formatMetadataDate(memorial.ceremony_date);
  const ceremonyPlace = [memorial.ceremony_location, memorial.ceremony_hall].filter(Boolean).join(" ");
  const ceremonyTime = memorial.ceremony_time ? ` เวลา ${memorial.ceremony_time} น.` : "";

  return [
    birthDate ? `ชาตะ ${birthDate}` : null,
    deathDate ? `มรณะ ${deathDate}` : null,
    memorial.age ? `อายุ ${memorial.age} ปี` : null,
    ceremonyDate ? `กำหนดพิธี ${ceremonyDate}${ceremonyTime}${ceremonyPlace ? ` ณ ${ceremonyPlace}` : ""}` : null,
  ].filter(Boolean).join(" · ");
}

export async function generateMetadata({ params }: SlugParams): Promise<Metadata> {
  const { slug } = await params;
  const memorial = await getMemorialBySlug(slug);
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/${slug}`;

  if (!memorial) {
    return {
      title: "หรีดร่วมบุญ",
      description: "ร่วมอาลัย ร่วมทำบุญ ร่วมลดขยะ",
      alternates: { canonical: pageUrl },
    };
  }

  const title = `หรีดร่วมบุญ ผู้วายชนม์ ${memorial.name}`;
  const description = buildShareDescription(memorial);
  const imageUrl = absoluteUrl(memorial.photo_url);
  const images = imageUrl ? [{ url: imageUrl, alt: memorial.name }] : undefined;

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "หรีดร่วมบุญ",
      type: "website",
      images,
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function SlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const memorial = await getMemorialBySlug(slug);

  if (!memorial) notFound();

  const basePath = `/${slug}`;
  const board = await getSiteSettings([HOME_BOARD_IMAGE_KEY, HOME_BOARD_CAPTION_KEY]);

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
        <main className="flex-1">
          <MemorialProfile memorial={memorial} />
          <CeremonyInfo memorial={memorial} />
          <div className="mt-1">
            <HomeScrollClient
              basePath={basePath}
              boardImageUrl={board[HOME_BOARD_IMAGE_KEY] ?? null}
              boardCaption={board[HOME_BOARD_CAPTION_KEY] ?? null}
            />
          </div>
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
