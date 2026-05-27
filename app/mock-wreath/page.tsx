"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Type, Sparkles, Download, Share2, Loader2, Check, Camera } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";

// ── Style presets ──────────────────────────────────────────────────────────

const STYLE_PRESETS = [
  {
    id: "temple",
    label: "ห้องโถงวัด",
    emoji: "🪔",
    desc: "แสงเทียน ดอกเบญจมาศ แท่นบูชา",
    preview: "linear-gradient(160deg,#1a0a02 0%,#3d1e00 50%,#1a0a02 100%)",
  },
  {
    id: "garden",
    label: "สวนดอกไม้",
    emoji: "🌸",
    desc: "ดอกไม้ขาว สวนสงบ แสงอ่อนยามเช้า",
    preview: "linear-gradient(160deg,#0d2b0d 0%,#1e5c1e 55%,#0d2b0d 100%)",
  },
  {
    id: "pavilion",
    label: "ศาลาวัด",
    emoji: "⛩️",
    desc: "ศาลาไทย ท้องฟ้า ดอกไม้พวงมาลัย",
    preview: "linear-gradient(180deg,#4a7fa0 0%,#2d6080 40%,#3a5a30 75%,#1a3a10 100%)",
  },
  {
    id: "luxury",
    label: "ห้องโถงหรู",
    emoji: "✨",
    desc: "ดอกไม้ขาวสูง แสงอบอุ่น ห้องหรู",
    preview: "linear-gradient(180deg,#1a0a2e 0%,#2d1450 55%,#0a0412 100%)",
  },
  {
    id: "river",
    label: "ริมน้ำยามเย็น",
    emoji: "🌅",
    desc: "พระอาทิตย์ตก ริมน้ำ ดอกบัว",
    preview: "linear-gradient(180deg,#b05828 0%,#7a3a18 40%,#2d1a08 100%)",
  },
  {
    id: "royal",
    label: "พระเมรุมาศ",
    emoji: "🏯",
    desc: "เจดีย์ทอง สถาปัตยกรรมไทย หรูหรา",
    preview: "linear-gradient(160deg,#1a0800 0%,#4a2200 35%,#261000 100%)",
  },
] as const;

type StyleId = (typeof STYLE_PRESETS)[number]["id"];

// ── Text options ───────────────────────────────────────────────────────────

const FONTS = [
  { id: "sarabun",         name: "Sarabun" },
  { id: "prompt",          name: "Prompt" },
  { id: "kanit",           name: "Kanit" },
  { id: "noto-serif-thai", name: "Noto Serif Thai" },
  { id: "mitr",            name: "Mitr" },
];

const TEXT_COLORS = [
  { id: "cream",   hex: "#F5DEB3" },
  { id: "white",   hex: "#ffffff" },
  { id: "gold",    hex: "#C8A96E" },
  { id: "brown",   hex: "#7C6341" },
  { id: "dark",    hex: "#2a1508" },
  { id: "navy",    hex: "#1a2c40" },
];

const FONT_SIZES = [
  { label: "S",  val: 0.7 },
  { label: "M",  val: 1.0 },
  { label: "L",  val: 1.3 },
  { label: "XL", val: 1.6 },
];

// ── Page ──────────────────────────────────────────────────────────────────

export default function MockWreathPage() {
  return (
    <Suspense>
      <MockWreathInner />
    </Suspense>
  );
}

function MockWreathInner() {
  const params     = useSearchParams();
  const name       = params.get("name")   ?? "";
  const title      = params.get("title")  ?? "";
  const amount     = params.get("amount") ?? "";
  const extraParams = new URLSearchParams({ name, title, amount }).toString();

  const canvasRef = useRef<HTMLDivElement>(null);
  const faceInputRef = useRef<HTMLInputElement>(null);

  // Tab
  const [tab, setTab] = useState<"style" | "face" | "text">("style");

  // Style / AI
  const [selectedStyle, setSelectedStyle] = useState<StyleId>("temple");
  const [aiImg,     setAiImg]     = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError,   setAiError]   = useState("");

  // Face
  const [facePreview, setFacePreview] = useState<string | null>(null);

  // Text
  const [fontId,    setFontId]    = useState(FONTS[0].id);
  const [fontSize,  setFontSize]  = useState(1.0);
  const [textColor, setTextColor] = useState(TEXT_COLORS[0].hex);

  // Actions
  const [saving, setSaving] = useState(false);
  const [shared, setShared] = useState(false);

  // Derived
  const currentStyle = STYLE_PRESETS.find(s => s.id === selectedStyle) ?? STYLE_PRESETS[0];
  const currentFont  = FONTS.find(f => f.id === fontId) ?? FONTS[0];

  const bgStyle: React.CSSProperties = aiImg
    ? { backgroundImage: `url(${aiImg})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: currentStyle.preview };

  // Load Google Fonts once
  useEffect(() => {
    if (document.getElementById("mock-wreath-gfonts")) return;
    const families = [
      "Sarabun:wght@400;700",
      "Prompt:wght@400;700",
      "Kanit:wght@400;700",
      "Noto+Serif+Thai:wght@400;700",
      "Mitr:wght@400;700",
    ].join("&family=");
    const link = document.createElement("link");
    link.id   = "mock-wreath-gfonts";
    link.rel  = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
    document.head.appendChild(link);
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────

  function handleFaceUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setFacePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleGenerate() {
    setAiLoading(true);
    setAiError("");
    setAiImg(null);
    try {
      const res  = await fetch("/api/generate-wreath", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ styleId: selectedStyle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "ไม่สามารถสร้างภาพได้");
      setAiImg(data.url);
      setTab("face");
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
    setAiLoading(false);
  }

  async function handleSave() {
    if (!canvasRef.current) return;
    setSaving(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(canvasRef.current, {
        scale: 3, useCORS: true, backgroundColor: "#1a0a02",
      });
      const link      = document.createElement("a");
      link.download   = `หรีดร่วมบุญ-${name || "ภาพ"}.png`;
      link.href       = canvas.toDataURL("image/png");
      link.click();
    } catch {}
    setSaving(false);
  }

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({ title: "จำลองภาพมอบหรีดร่วมบุญ", url: window.location.href }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(window.location.href).catch(() => {});
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "#ffffff" }}>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-cream-100/95 backdrop-blur-sm border-b border-gold-200">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-between">
          <div className="w-8" />
          <div className="flex items-center gap-2">
            <LotusIcon className="w-6 h-6 text-gold-600" />
            <div className="text-center">
              <h1 className="text-lg font-bold leading-tight gold-gradient-text tracking-wide">หรีดร่วมบุญ</h1>
              <p className="text-[9px] font-medium text-gold-500 tracking-[0.25em] uppercase -mt-0.5">Zero Waste</p>
            </div>
            <LotusIcon className="w-6 h-6 text-gold-600 scale-x-[-1]" />
          </div>
          <div className="w-8" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

          {/* ── Canvas preview ─────────────────────────────────────────── */}
          <div
            ref={canvasRef}
            className="relative w-full rounded-2xl overflow-hidden select-none"
            style={{ aspectRatio: "3/4", ...bgStyle }}
          >
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/35" />

            {/* Top ornament */}
            <div className="absolute top-4 left-0 right-0 flex justify-center gap-1 opacity-60 pointer-events-none">
              <LotusIcon className="w-5 h-5 text-gold-200" />
              <span className="text-gold-200 text-xs leading-none mt-1">◆</span>
              <LotusIcon className="w-5 h-5 text-gold-200 scale-x-[-1]" />
            </div>

            {/* Face photo — circular overlay */}
            {facePreview ? (
              <div className="absolute top-[20%] left-1/2 -translate-x-1/2">
                <div
                  className="w-32 h-32 rounded-full overflow-hidden shadow-2xl"
                  style={{ border: "3px solid #c9a84c" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={facePreview} alt="รูปหน้า" className="w-full h-full object-cover" />
                </div>
              </div>
            ) : (
              !aiImg && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-white/30 text-xs tracking-wide text-center px-8 leading-relaxed">
                    เลือกสไตล์ → สร้างภาพ AI<br />จากนั้นแนบรูปหน้า
                  </p>
                </div>
              )
            )}

            {/* Bottom name plate */}
            <div className="absolute bottom-0 left-0 right-0 pb-5 px-5 flex flex-col items-center gap-2">
              <p className="text-white/60 text-[10px] tracking-[0.25em] font-light">— หรีดร่วมบุญ Zero Waste —</p>
              <div
                className="w-full rounded-xl overflow-hidden"
                style={{
                  background: "linear-gradient(135deg,#fdf8ee 0%,#f5e8c4 100%)",
                  border: "1.5px solid #c9a84c",
                  boxShadow: "0 6px 24px rgba(0,0,0,0.55), inset 0 0 0 2px #fdf8ee",
                  padding: "10px 14px 8px",
                }}
              >
                <p
                  className="text-center font-bold leading-snug"
                  style={{
                    fontFamily: `'${currentFont.name}', 'Sarabun', sans-serif`,
                    fontSize: `${Math.round(22 * fontSize)}px`,
                    color: textColor,
                  }}
                >
                  {name || "ชื่อผู้มอบหรีด"}
                </p>
                {title && (
                  <p
                    className="text-center leading-snug mt-0.5"
                    style={{
                      fontFamily: `'${currentFont.name}', 'Sarabun', sans-serif`,
                      fontSize: `${Math.round(13 * fontSize)}px`,
                      color: textColor,
                      opacity: 0.78,
                    }}
                  >
                    {title}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Tabs ───────────────────────────────────────────────────── */}
          <div className="flex rounded-2xl gold-border bg-cream-50 p-1 gap-1">
            {([
              { id: "style", icon: Sparkles, label: "สไตล์" },
              { id: "face",  icon: Camera,   label: "รูปหน้า" },
              { id: "text",  icon: Type,     label: "ตัวอักษร" },
            ] as const).map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                  tab === t.id
                    ? "gold-gradient text-white shadow-sm"
                    : "text-gold-500 hover:text-gold-700"
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Tab: สไตล์ ─────────────────────────────────────────────── */}
          {tab === "style" && (
            <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 space-y-4">
              <p className="text-xs font-semibold text-gold-700">เลือกสไตล์ฉากหลัง</p>

              {/* Style cards grid */}
              <div className="grid grid-cols-2 gap-3">
                {STYLE_PRESETS.map(style => (
                  <button
                    key={style.id}
                    onClick={() => {
                      setSelectedStyle(style.id);
                      setAiImg(null);
                      setAiError("");
                    }}
                    className={`relative rounded-2xl overflow-hidden border-2 text-left transition-all ${
                      selectedStyle === style.id
                        ? "border-gold-500 ring-2 ring-gold-300 scale-[1.02]"
                        : "border-transparent hover:border-gold-300"
                    }`}
                    style={{ background: style.preview, minHeight: "110px" }}
                  >
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="relative p-3 pb-2">
                      <span className="text-2xl leading-none">{style.emoji}</span>
                      <p className="text-white font-bold text-sm mt-1.5 leading-tight">{style.label}</p>
                      <p className="text-white/70 text-[10px] leading-tight mt-0.5">{style.desc}</p>
                    </div>
                    {selectedStyle === style.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gold-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={aiLoading}
                className="w-full gold-gradient text-white font-semibold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
              >
                {aiLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังสร้างภาพ AI...</>
                  : <><Sparkles className="w-4 h-4" /> สร้างภาพ AI</>
                }
              </button>

              {aiError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-xs text-red-600 leading-relaxed">
                  {aiError}
                </div>
              )}

              {aiImg && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <p className="text-xs text-green-700 font-semibold">สร้างภาพแล้ว — ไปแนบรูปหน้าต่อได้เลย</p>
                </div>
              )}

              <p className="text-[10px] text-gold-400 text-center leading-relaxed">
                ใช้ DALL-E 3 · ต้องตั้งค่า OPENAI_API_KEY · ค่าใช้จ่ายประมาณ ~$0.04 ต่อภาพ
              </p>
            </div>
          )}

          {/* ── Tab: รูปหน้า ───────────────────────────────────────────── */}
          {tab === "face" && (
            <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 space-y-3">
              <div>
                <p className="text-xs font-semibold text-gold-700">แนบรูปหน้า</p>
                <p className="text-[11px] text-gold-500 mt-0.5">
                  รูปหน้าจะแสดงเป็นวงกลมกลางภาพ เหนือป้ายชื่อ (ไม่บังคับ)
                </p>
              </div>

              <label className="flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed border-gold-300 bg-white cursor-pointer hover:bg-cream-50 transition-colors">
                {facePreview ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gold-400 shadow-md">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={facePreview} alt="รูปหน้า" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-xs text-gold-500">แตะเพื่อเปลี่ยนรูป</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gold-400">
                    <Camera className="w-9 h-9" />
                    <span className="text-sm font-semibold text-gold-600">แนบรูปหน้า / รูปถ่าย</span>
                    <span className="text-[10px]">JPG, PNG</span>
                  </div>
                )}
                <input ref={faceInputRef} type="file" accept="image/*" onChange={handleFaceUpload} className="hidden" />
              </label>

              {facePreview && (
                <button
                  onClick={() => setFacePreview(null)}
                  className="w-full py-2.5 rounded-xl border border-red-200 text-red-400 text-xs font-semibold hover:bg-red-50 transition-colors"
                >
                  ลบรูปหน้า
                </button>
              )}
            </div>
          )}

          {/* ── Tab: ตัวอักษร ──────────────────────────────────────────── */}
          {tab === "text" && (
            <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 space-y-4">

              {/* Font */}
              <div>
                <p className="text-xs font-semibold text-gold-700 mb-2">ฟอนต์ ({FONTS.length} แบบ)</p>
                <div className="space-y-2">
                  {FONTS.map(font => (
                    <button
                      key={font.id}
                      onClick={() => setFontId(font.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${
                        fontId === font.id
                          ? "border-gold-400 bg-gold-50"
                          : "border-gold-100 bg-white hover:border-gold-200"
                      }`}
                    >
                      <span
                        className="text-gold-800 text-base font-bold"
                        style={{ fontFamily: `'${font.name}', sans-serif` }}
                      >
                        {name || "ตัวอย่างชื่อ"}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-gold-400">{font.name}</span>
                        {fontId === font.id && <Check className="w-4 h-4 text-gold-500" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font size */}
              <div>
                <p className="text-xs font-semibold text-gold-700 mb-2">ขนาดตัวอักษร</p>
                <div className="flex gap-2">
                  {FONT_SIZES.map(s => (
                    <button
                      key={s.label}
                      onClick={() => setFontSize(s.val)}
                      className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                        fontSize === s.val
                          ? "gold-gradient text-white border-transparent shadow-sm"
                          : "border-gold-200 text-gold-600 bg-white hover:border-gold-300"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text color */}
              <div>
                <p className="text-xs font-semibold text-gold-700 mb-2">สีตัวอักษร</p>
                <div className="flex gap-3">
                  {TEXT_COLORS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setTextColor(c.hex)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        textColor === c.hex
                          ? "border-gold-500 scale-110 shadow-md"
                          : "border-transparent hover:border-gold-300 hover:scale-105"
                      }`}
                      style={{
                        backgroundColor: c.hex,
                        boxShadow: c.hex === "#ffffff" ? "inset 0 0 0 1px #e8c05a" : undefined,
                      }}
                    />
                  ))}
                </div>

                {/* Preview */}
                <div
                  className="mt-3 rounded-xl px-4 py-3 text-center"
                  style={{ background: "linear-gradient(135deg,#1a0a02 0%,#2d1508 100%)" }}
                >
                  <p
                    className="font-bold leading-snug"
                    style={{
                      fontFamily: `'${currentFont.name}', 'Sarabun', sans-serif`,
                      fontSize: `${Math.round(18 * fontSize)}px`,
                      color: textColor,
                    }}
                  >
                    {name || "ตัวอย่างชื่อผู้มอบ"}
                  </p>
                  {title && (
                    <p
                      className="leading-snug mt-0.5"
                      style={{
                        fontFamily: `'${currentFont.name}', 'Sarabun', sans-serif`,
                        fontSize: `${Math.round(12 * fontSize)}px`,
                        color: textColor,
                        opacity: 0.75,
                      }}
                    >
                      {title}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Save + Share ────────────────────────────────────────────── */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 gold-gradient text-white font-semibold py-4 rounded-2xl text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              {saving ? "กำลังบันทึก..." : "บันทึกภาพ"}
            </button>
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-gold-400 bg-cream-50 text-gold-700 font-semibold text-sm hover:bg-cream-100 active:scale-[0.98] transition-all shadow-sm"
            >
              <Share2 className="w-4 h-4" />
              {shared ? "คัดลอกแล้ว" : "แชร์"}
            </button>
          </div>

          <Link
            href={`/ecard?${extraParams}`}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border-2 border-gold-300 bg-cream-50 text-gold-700 font-semibold text-sm hover:bg-cream-100 transition-colors shadow-sm"
          >
            ย้อนกลับ
          </Link>

          <div className="h-2" />
        </div>
      </main>
    </div>
  );
}
