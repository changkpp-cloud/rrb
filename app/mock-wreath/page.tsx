"use client";

import { Suspense, useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Upload, ImagePlus, Type, Sparkles, Download, Share2,
  Clock, Trash2, Loader2, Check,
} from "lucide-react";
import LotusIcon from "@/components/LotusIcon";

// ── Constants ──────────────────────────────────────────────

const FONTS = [
  { id: "sarabun",        name: "Sarabun",         sample: "สารบัญ" },
  { id: "prompt",         name: "Prompt",          sample: "พรอมท์" },
  { id: "kanit",          name: "Kanit",           sample: "กนิต" },
  { id: "noto-serif-thai",name: "Noto Serif Thai", sample: "เซอริฟ" },
  { id: "mitr",           name: "Mitr",            sample: "มิตร" },
];

const TEXT_COLORS = [
  { id: "dark-brown", hex: "#2a1508" },
  { id: "brown",      hex: "#5C3D2E" },
  { id: "gold-brown", hex: "#7C6341" },
  { id: "gold",       hex: "#C8A96E" },
  { id: "white",      hex: "#ffffff" },
  { id: "cream",      hex: "#F5DEB3" },
  { id: "navy",       hex: "#1a2c40" },
  { id: "forest",     hex: "#1a3a1a" },
];

const FONT_SIZES = [
  { label: "S",  val: 0.7 },
  { label: "M",  val: 1.0 },
  { label: "L",  val: 1.3 },
  { label: "XL", val: 1.6 },
];

const SCENES = [
  { id: "bokeh",   label: "บอเก้มืด",   css: "radial-gradient(ellipse at 50% 30%, #3a2010 0%, #180b05 100%)" },
  { id: "garden",  label: "สวนดอกไม้", css: "linear-gradient(160deg,#143a10 0%,#2d6020 55%,#143a10 100%)" },
  { id: "hall",    label: "ห้องโถง",    css: "linear-gradient(180deg,#261436 0%,#140820 60%,#0a0412 100%)" },
  { id: "outdoor", label: "กลางแจ้ง",  css: "linear-gradient(180deg,#6ab0d4 0%,#4a8fba 35%,#5a8a4a 78%,#3a5a30 100%)" },
];

const DRAFT_KEY = "mock-wreath-drafts-v1";
const DRAFT_EXPIRY = 7 * 24 * 60 * 60 * 1000;

// ── Types ──────────────────────────────────────────────────

interface Img { id: string; url: string }

interface Draft {
  id: string;
  timestamp: number;
  fontId: string;
  fontSize: number;
  textColor: string;
  sceneId: string;
}

// ── Page ───────────────────────────────────────────────────

export default function MockWreathPage() {
  return (
    <Suspense>
      <MockWreathInner />
    </Suspense>
  );
}

function MockWreathInner() {
  const params = useSearchParams();
  const name   = params.get("name")   ?? "";
  const title  = params.get("title")  ?? "";
  const amount = params.get("amount") ?? "";
  const extraParams = new URLSearchParams({ name, title, amount }).toString();

  // Refs
  const canvasRef  = useRef<HTMLDivElement>(null);
  const fileRef    = useRef<HTMLInputElement>(null);

  // Tab
  const [tab, setTab] = useState<"image" | "font" | "ai">("image");

  // Background
  const [uploads, setUploads]         = useState<Img[]>([]);
  const [aiImgs, setAiImgs]           = useState<Img[]>([]);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [sceneId, setSceneId]         = useState(SCENES[0].id);

  // Font / text
  const [fontId,    setFontId]    = useState(FONTS[0].id);
  const [fontSize,  setFontSize]  = useState(1.0);
  const [textColor, setTextColor] = useState(TEXT_COLORS[0].hex);

  // AI
  const [aiPrompt,    setAiPrompt]    = useState("");
  const [aiLoading,   setAiLoading]   = useState(false);
  const [aiError,     setAiError]     = useState("");

  // Draft
  const [drafts,       setDrafts]       = useState<Draft[]>([]);
  const [lastSaved,    setLastSaved]    = useState<Date | null>(null);
  const [showHistory,  setShowHistory]  = useState(false);

  // Save
  const [saving, setSaving] = useState(false);

  // ── Computed ──────────────────────────────────────────────

  const allImgs = [...uploads, ...aiImgs];
  const selectedImg = allImgs.find(i => i.id === selectedId);
  const currentScene = SCENES.find(s => s.id === sceneId) ?? SCENES[0];
  const currentFont  = FONTS.find(f => f.id === fontId) ?? FONTS[0];

  const bgStyle: React.CSSProperties = selectedImg
    ? { backgroundImage: `url(${selectedImg.url})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: currentScene.css };

  // ── Effects ───────────────────────────────────────────────

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
    link.id = "mock-wreath-gfonts";
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
    document.head.appendChild(link);
  }, []);

  // Load + purge expired drafts on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const all: Draft[] = JSON.parse(raw);
      const now = Date.now();
      const valid = all.filter(d => now - d.timestamp < DRAFT_EXPIRY);
      setDrafts(valid);
      if (valid.length > 0) applyDraft(valid[0]);
      if (valid.length !== all.length)
        localStorage.setItem(DRAFT_KEY, JSON.stringify(valid));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save every 30 s
  const saveDraft = useCallback(() => {
    const draft: Draft = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      fontId, fontSize, textColor, sceneId,
    };
    setDrafts(prev => {
      const updated = [draft, ...prev.slice(0, 6)];
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
    setLastSaved(new Date());
  }, [fontId, fontSize, textColor, sceneId]);

  useEffect(() => {
    const id = setInterval(saveDraft, 30_000);
    return () => clearInterval(id);
  }, [saveDraft]);

  // ── Handlers ──────────────────────────────────────────────

  function applyDraft(d: Draft) {
    setFontId(d.fontId);
    setFontSize(d.fontSize);
    setTextColor(d.textColor);
    setSceneId(d.sceneId);
    setSelectedId(null);
  }

  function deleteDraft(id: string) {
    setDrafts(prev => {
      const updated = prev.filter(d => d.id !== id);
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 12);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        const url = ev.target?.result as string;
        const id  = `up-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setUploads(prev => [{ id, url }, ...prev].slice(0, 12));
        setSelectedId(id);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  async function handleGenerate() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError("");
    try {
      const res  = await fetch("/api/generate-wreath", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "ไม่สามารถสร้างภาพได้");
      const id = `ai-${Date.now()}`;
      setAiImgs(prev => [{ id, url: data.url }, ...prev].slice(0, 6));
      setSelectedId(id);
      setTab("image");
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
        scale: 3, useCORS: true, backgroundColor: "#180b05",
      });
      const link = document.createElement("a");
      link.download = `หรีดร่วมบุญ-${name || "ภาพ"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {}
    setSaving(false);
  }

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({ title: "จำลองภาพมอบหรีดร่วมบุญ", url: window.location.href }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: "#ffffff" }}
    >
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

          {/* ── Canvas Preview ──────────────────────────── */}
          <div
            ref={canvasRef}
            className="relative w-full rounded-2xl overflow-hidden select-none"
            style={{ aspectRatio: "4/3", ...bgStyle }}
          >
            {/* Dim overlay */}
            <div className="absolute inset-0 bg-black/25" />

            {/* Top ornament */}
            <div className="absolute top-4 left-0 right-0 flex justify-center gap-1 opacity-60 pointer-events-none">
              <LotusIcon className="w-5 h-5 text-gold-200" />
              <span className="text-gold-200 text-xs leading-none mt-1">◆</span>
              <LotusIcon className="w-5 h-5 text-gold-200 scale-x-[-1]" />
            </div>

            {/* Hint when no image */}
            {!selectedImg && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-white/30 text-xs tracking-wide">อัปโหลดรูปหรือสร้างด้วย AI</p>
              </div>
            )}

            {/* Bottom: label + sign card */}
            <div className="absolute bottom-0 left-0 right-0 pb-5 px-5 flex flex-col items-center gap-2">
              <p className="text-white/70 text-[10px] tracking-[0.25em] font-light">— หรีดร่วมบุญ Zero Waste —</p>

              {/* Sign card */}
              <div
                className="w-full rounded-xl overflow-hidden"
                style={{
                  background: "linear-gradient(135deg,#fdf8ee 0%,#f5e8c4 100%)",
                  border: "1.5px solid #c9a84c",
                  boxShadow: "0 6px 24px rgba(0,0,0,0.55), inset 0 0 0 2px #fdf8ee, inset 0 0 0 3px rgba(201,168,76,0.3)",
                  padding: "10px 14px 8px",
                }}
              >
                <p
                  className="text-center font-bold leading-snug whitespace-nowrap overflow-hidden text-ellipsis"
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
                    className="text-center leading-snug whitespace-nowrap overflow-hidden text-ellipsis mt-0.5"
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

          {/* ── Auto-save status ───────────────────────── */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-gold-400 text-xs">
              <Clock className="w-3 h-3" />
              {lastSaved
                ? `บันทึกอัตโนมัติ ${lastSaved.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}`
                : "บันทึกอัตโนมัติทุก 30 วินาที"}
            </div>
            {drafts.length > 0 && (
              <button
                onClick={() => setShowHistory(v => !v)}
                className="text-xs text-gold-600 font-semibold flex items-center gap-1 hover:text-gold-800 transition-colors"
              >
                <Clock className="w-3 h-3" />
                ประวัติ ({drafts.length})
              </button>
            )}
          </div>

          {/* Draft history */}
          {showHistory && (
            <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3 space-y-1">
              <p className="text-xs font-semibold text-gold-700 mb-2">ประวัติ Draft (เก็บ 7 วัน)</p>
              {drafts.map(d => (
                <div key={d.id} className="flex items-center gap-2 py-1.5 border-b border-gold-100 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gold-700 font-medium">
                      {new Date(d.timestamp).toLocaleDateString("th-TH", { month: "short", day: "numeric" })}
                      {" "}
                      {new Date(d.timestamp).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="text-[10px] text-gold-400 truncate">
                      {FONTS.find(f => f.id === d.fontId)?.name} · ขนาด {FONT_SIZES.find(s => s.val === d.fontSize)?.label ?? d.fontSize}
                    </p>
                  </div>
                  <button
                    onClick={() => { applyDraft(d); setShowHistory(false); }}
                    className="text-[11px] px-3 py-1 rounded-lg bg-gold-50 border border-gold-200 text-gold-700 font-semibold hover:bg-gold-100 transition-colors shrink-0"
                  >
                    โหลด
                  </button>
                  <button onClick={() => deleteDraft(d.id)} className="text-gold-300 hover:text-red-400 transition-colors shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── Tabs ───────────────────────────────────── */}
          <div className="flex rounded-2xl gold-border bg-cream-50 p-1 gap-1">
            {([
              { id: "image", icon: ImagePlus, label: "ภาพ" },
              { id: "font",  icon: Type,      label: "ฟอนต์" },
              { id: "ai",    icon: Sparkles,  label: "AI" },
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

          {/* ── Tab: Image ─────────────────────────────── */}
          {tab === "image" && (
            <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 space-y-4">

              {/* Upload */}
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gold-300 bg-cream-50 hover:bg-cream-100 text-gold-600 font-semibold text-sm transition-colors"
              >
                <Upload className="w-4 h-4" />
                อัปโหลดรูปภาพ (สูงสุด 12 รูป)
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />

              {/* Uploaded gallery */}
              {uploads.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gold-700 mb-2">รูปภาพของคุณ ({uploads.length})</p>
                  <div className="grid grid-cols-4 gap-2">
                    {uploads.map(img => (
                      <button
                        key={img.id}
                        onClick={() => setSelectedId(img.id)}
                        className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                          selectedId === img.id ? "border-gold-500 ring-2 ring-gold-300" : "border-transparent hover:border-gold-300"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* AI images in gallery */}
              {aiImgs.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gold-700 mb-2">ภาพจาก AI ({aiImgs.length})</p>
                  <div className="grid grid-cols-4 gap-2">
                    {aiImgs.map(img => (
                      <button
                        key={img.id}
                        onClick={() => setSelectedId(img.id)}
                        className={`aspect-square rounded-xl overflow-hidden border-2 transition-all relative ${
                          selectedId === img.id ? "border-gold-500 ring-2 ring-gold-300" : "border-transparent hover:border-gold-300"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute top-1 right-1 bg-gold-500 rounded-full w-4 h-4 flex items-center justify-center">
                          <Sparkles className="w-2.5 h-2.5 text-white" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Default scenes */}
              <div>
                <p className="text-xs font-semibold text-gold-700 mb-2">ฉากพื้นหลัง</p>
                <div className="grid grid-cols-4 gap-2">
                  {SCENES.map(scene => (
                    <button
                      key={scene.id}
                      onClick={() => { setSceneId(scene.id); setSelectedId(null); }}
                      className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-end pb-1 transition-all overflow-hidden ${
                        !selectedId && sceneId === scene.id
                          ? "border-gold-500 ring-2 ring-gold-300"
                          : "border-transparent hover:border-gold-300"
                      }`}
                      style={{ background: scene.css }}
                    >
                      <span className="text-white/90 text-[9px] font-semibold bg-black/35 px-1.5 py-0.5 rounded-full">
                        {scene.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Font ──────────────────────────────── */}
          {tab === "font" && (
            <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 space-y-4">

              {/* Font list */}
              <div>
                <p className="text-xs font-semibold text-gold-700 mb-2">ฟอนต์ (5 แบบ)</p>
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

              {/* Color palette */}
              <div>
                <p className="text-xs font-semibold text-gold-700 mb-2">สีตัวอักษร</p>
                <div className="flex flex-wrap gap-2.5">
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

          {/* ── Tab: AI ────────────────────────────────── */}
          {tab === "ai" && (
            <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold-500" />
                <p className="text-sm font-semibold text-gold-700">สร้างฉากด้วย DALL-E 3</p>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs text-gold-500 leading-relaxed">
                  อธิบายฉากที่ต้องการ ระบบจะสร้างภาพพื้นหลังที่เหมาะกับงานศพไทย
                </p>
                <textarea
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  rows={3}
                  placeholder={"เช่น สวนดอกไม้ บรรยากาศงานศพไทย แสงเทียนนวล\nหรือ ห้องโถงวัด ดอกไม้ขาว แสงสลัว"}
                  className="w-full px-4 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm resize-none"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={aiLoading || !aiPrompt.trim()}
                className="w-full gold-gradient text-white font-semibold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity"
              >
                {aiLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังสร้างภาพ...</>
                  : <><Sparkles className="w-4 h-4" /> สร้างภาพ AI</>
                }
              </button>

              {aiError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-xs text-red-600 leading-relaxed">
                  {aiError}
                </div>
              )}

              {aiImgs.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gold-700 mb-2">ภาพที่สร้างแล้ว</p>
                  <div className="grid grid-cols-3 gap-2">
                    {aiImgs.map(img => (
                      <button
                        key={img.id}
                        onClick={() => { setSelectedId(img.id); setTab("image"); }}
                        className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                          selectedId === img.id ? "border-gold-500 ring-2 ring-gold-300" : "border-transparent hover:border-gold-300"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-cream-100 border border-gold-200 rounded-xl px-3 py-2.5 flex gap-2">
                <Sparkles className="w-3.5 h-3.5 text-gold-400 shrink-0 mt-0.5" />
                <p className="text-xs text-gold-500 leading-relaxed">
                  ต้องตั้งค่า <span className="font-mono font-semibold text-gold-700">OPENAI_API_KEY</span> ใน{" "}
                  <span className="font-mono">.env.local</span> — ใช้ DALL-E 3 (มีค่าใช้จ่าย ~$0.04 ต่อภาพ)
                </p>
              </div>
            </div>
          )}

          {/* ── Action buttons ─────────────────────────── */}
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
              แชร์
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
