import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "หรีดร่วมบุญ - Zero Waste",
  description:
    "ร่วมอาลัย ร่วมทำบุญ ร่วมลดขยะ — แพลตฟอร์มหรีดดิจิทัลเพื่อสิ่งแวดล้อม",
  keywords: ["หรีด", "งานศพ", "zero waste", "ทำบุญ", "หรีดร่วมบุญ"],
  openGraph: {
    title: "หรีดร่วมบุญ - Zero Waste",
    description: "ร่วมอาลัย ร่วมทำบุญ ร่วมลดขยะ",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">

        {/* ── Celestial decorative background layer ── */}
        <div
          aria-hidden="true"
          style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}
        >

          {/* ═══ HEAVEN LIGHT ═══ */}
          {/* Main radial glow — heaven light pouring from above */}
          <div style={{
            position: "absolute", top: "-22%", left: "50%",
            transform: "translateX(-50%)",
            width: "190%", height: "78%",
            background: "radial-gradient(ellipse at center top, rgba(245,222,170,0.58) 0%, rgba(232,200,140,0.26) 26%, rgba(243,198,168,0.08) 50%, transparent 68%)",
          }} />

          {/* Light ray — center beam */}
          <div style={{
            position: "absolute", top: 0, left: "50%",
            transform: "translateX(-50%)",
            width: "180px", height: "62%",
            background: "linear-gradient(180deg, rgba(245,222,170,0.30) 0%, transparent 100%)",
            filter: "blur(24px)",
          }} />
          {/* Light ray — left-center */}
          <div style={{
            position: "absolute", top: 0, left: "35%",
            width: "110px", height: "52%",
            background: "linear-gradient(168deg, rgba(245,222,170,0.20) 0%, transparent 100%)",
            filter: "blur(20px)",
          }} />
          {/* Light ray — right-center */}
          <div style={{
            position: "absolute", top: 0, right: "35%",
            width: "110px", height: "52%",
            background: "linear-gradient(192deg, rgba(245,222,170,0.20) 0%, transparent 100%)",
            filter: "blur(20px)",
          }} />
          {/* Light ray — left-outer */}
          <div style={{
            position: "absolute", top: 0, left: "20%",
            width: "72px", height: "44%",
            background: "linear-gradient(160deg, rgba(232,216,180,0.12) 0%, transparent 100%)",
            filter: "blur(18px)",
          }} />
          {/* Light ray — right-outer */}
          <div style={{
            position: "absolute", top: 0, right: "20%",
            width: "72px", height: "44%",
            background: "linear-gradient(200deg, rgba(232,216,180,0.12) 0%, transparent 100%)",
            filter: "blur(18px)",
          }} />

          {/* ═══ CLOUDS ═══ */}
          {/* Cloud — upper left, large */}
          <div style={{
            position: "absolute", top: "0%", left: "-20%",
            width: "72%", height: "34%",
            background: "radial-gradient(ellipse at 36% 52%, rgba(255,252,248,0.97) 0%, rgba(247,243,234,0.68) 36%, transparent 66%)",
            filter: "blur(32px)", borderRadius: "50%",
          }} />
          {/* Cloud — upper right, large */}
          <div style={{
            position: "absolute", top: "-3%", right: "-20%",
            width: "68%", height: "36%",
            background: "radial-gradient(ellipse at 64% 50%, rgba(255,252,248,0.94) 0%, rgba(247,243,234,0.62) 38%, transparent 66%)",
            filter: "blur(30px)", borderRadius: "50%",
          }} />
          {/* Cloud — upper center, halo */}
          <div style={{
            position: "absolute", top: "-10%", left: "50%",
            transform: "translateX(-50%)",
            width: "100%", height: "30%",
            background: "radial-gradient(ellipse, rgba(255,252,248,0.75) 0%, transparent 60%)",
            filter: "blur(36px)", borderRadius: "50%",
          }} />
          {/* Cloud — mid left */}
          <div style={{
            position: "absolute", top: "36%", left: "-24%",
            width: "50%", height: "24%",
            background: "radial-gradient(ellipse at 44% 52%, rgba(255,252,248,0.52) 0%, transparent 66%)",
            filter: "blur(24px)", borderRadius: "50%",
          }} />
          {/* Cloud — mid right */}
          <div style={{
            position: "absolute", top: "30%", right: "-22%",
            width: "46%", height: "22%",
            background: "radial-gradient(ellipse at 56% 50%, rgba(255,252,248,0.46) 0%, transparent 66%)",
            filter: "blur(26px)", borderRadius: "50%",
          }} />

          {/* ═══ FLOATING PARTICLES ═══ */}
          <div style={{ position: "absolute", top: "7%",  left:  "13%", width: "7px", height: "7px", borderRadius: "50%", background: "rgba(245,222,170,0.72)", filter: "blur(2px)" }} />
          <div style={{ position: "absolute", top: "10%", right: "15%", width: "5px", height: "5px", borderRadius: "50%", background: "rgba(232,200,140,0.62)", filter: "blur(2px)" }} />
          <div style={{ position: "absolute", top: "18%", left:  "22%", width: "6px", height: "6px", borderRadius: "50%", background: "rgba(245,222,170,0.52)", filter: "blur(3px)" }} />
          <div style={{ position: "absolute", top: "15%", right: "25%", width: "4px", height: "4px", borderRadius: "50%", background: "rgba(243,198,168,0.68)", filter: "blur(2px)" }} />
          <div style={{ position: "absolute", top: "27%", left:  "6%",  width: "5px", height: "5px", borderRadius: "50%", background: "rgba(232,216,180,0.48)", filter: "blur(2px)" }} />
          <div style={{ position: "absolute", top: "23%", right: "8%",  width: "6px", height: "6px", borderRadius: "50%", background: "rgba(245,222,170,0.58)", filter: "blur(3px)" }} />
          <div style={{ position: "absolute", top: "44%", left:  "3%",  width: "4px", height: "4px", borderRadius: "50%", background: "rgba(243,198,168,0.38)", filter: "blur(2px)" }} />
          <div style={{ position: "absolute", top: "50%", right: "4%",  width: "5px", height: "5px", borderRadius: "50%", background: "rgba(232,216,180,0.42)", filter: "blur(2px)" }} />
          <div style={{ position: "absolute", top: "62%", left:  "8%",  width: "3px", height: "3px", borderRadius: "50%", background: "rgba(245,222,170,0.32)", filter: "blur(2px)" }} />
          <div style={{ position: "absolute", top: "68%", right: "6%",  width: "4px", height: "4px", borderRadius: "50%", background: "rgba(243,198,168,0.30)", filter: "blur(2px)" }} />

          {/* ═══ LOTUS GLOWS ═══ */}
          {/* Bottom-left lotus warm glow */}
          <div style={{
            position: "absolute", bottom: "4%", left: "0%",
            width: "42%", height: "32%",
            background: "radial-gradient(ellipse, rgba(245,222,170,0.34) 0%, rgba(232,216,180,0.16) 40%, transparent 68%)",
            filter: "blur(16px)",
          }} />
          {/* Bottom-right lotus warm glow */}
          <div style={{
            position: "absolute", bottom: "8%", right: "0%",
            width: "36%", height: "26%",
            background: "radial-gradient(ellipse, rgba(243,198,168,0.30) 0%, rgba(245,222,170,0.14) 40%, transparent 68%)",
            filter: "blur(13px)",
          }} />
          {/* Bottom ambient warmth spread */}
          <div style={{
            position: "absolute", bottom: "-14%", left: "50%",
            transform: "translateX(-50%)",
            width: "140%", height: "50%",
            background: "radial-gradient(ellipse at center bottom, rgba(243,198,168,0.26) 0%, rgba(245,222,170,0.10) 40%, transparent 65%)",
          }} />

          {/* ═══ THAI TEMPLE SILHOUETTE ═══ */}
          {/* Very subtle pavilion / วิมาน at bottom-center */}
          <div style={{
            position: "absolute", bottom: 0, left: "50%",
            transform: "translateX(-50%)",
            width: "100%", maxWidth: "520px",
            opacity: 0.042,
          }}>
            <svg viewBox="0 0 520 110" style={{ width: "100%", display: "block" }} fill="#6B4A24" xmlns="http://www.w3.org/2000/svg">
              {/* Tier 1 — base roof */}
              <path d="M0 110 L110 62 L260 14 L410 62 L520 110 Z" />
              {/* Tier 2 */}
              <path d="M90 62 L180 34 L260 6 L340 34 L430 62 Z" />
              {/* Tier 3 */}
              <path d="M155 34 L218 16 L260 2 L302 16 L365 34 Z" />
              {/* Spire */}
              <path d="M248 16 L260 0 L272 16 Z" fill="#C9983C" />
              {/* Left eave curve */}
              <path d="M78 62 Q38 58 0 76" stroke="#6B4A24" strokeWidth="1.5" fill="none" />
              {/* Right eave curve */}
              <path d="M442 62 Q482 58 520 76" stroke="#6B4A24" strokeWidth="1.5" fill="none" />
              {/* Central hall */}
              <rect x="228" y="62" width="64" height="48" />
            </svg>
          </div>

        </div>

        {/* Page content sits above decorative layer */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
