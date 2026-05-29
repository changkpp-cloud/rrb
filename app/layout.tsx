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

        {/* iOS 17 — minimal ambient glow */}
        <div
          aria-hidden="true"
          style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}
        >
          {/* Soft top warmth */}
          <div style={{
            position: "absolute", top: "-18%", left: "50%",
            transform: "translateX(-50%)",
            width: "170%", height: "68%",
            background: "radial-gradient(ellipse at center top, rgba(245,222,170,0.28) 0%, rgba(232,200,140,0.10) 38%, transparent 62%)",
            filter: "blur(36px)",
          }} />
          {/* Warm bottom accent */}
          <div style={{
            position: "absolute", bottom: "5%", left: "50%",
            transform: "translateX(-50%)",
            width: "120%", height: "40%",
            background: "radial-gradient(ellipse at center bottom, rgba(243,198,168,0.18) 0%, transparent 60%)",
            filter: "blur(28px)",
          }} />
        </div>

        {/* Page content sits above decorative layer */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
