import { PDFDocument, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { createAdminClient } from "@/lib/supabase/admin";

const PRINTNODE_API = "https://api.printnode.com";

// A6 landscape in points (1mm = 2.835pt)
const PAGE_W = Math.round(148 * 2.835); // 419pt
const PAGE_H = Math.round(105 * 2.835); // 298pt

// Google Fonts stable TTF URLs for Sarabun (Thai support)
const FONT_REGULAR_URL = "https://fonts.gstatic.com/s/sarabun/v15/DtVmJx26TKEr37c9YHZJnXIN.ttf";
const FONT_BOLD_URL    = "https://fonts.gstatic.com/s/sarabun/v15/DtVhJx26TKEr37c9YL1xu3gV.ttf";

// Module-level cache (warm serverless reuse)
let fontRegularBytes: Uint8Array | null = null;
let fontBoldBytes: Uint8Array | null = null;

async function loadFonts(): Promise<{ regular: Uint8Array; bold: Uint8Array }> {
  if (!fontRegularBytes) {
    const res = await fetch(FONT_REGULAR_URL, { cache: "force-cache" });
    if (!res.ok) throw new Error("Failed to load Sarabun Regular font");
    fontRegularBytes = new Uint8Array(await res.arrayBuffer());
  }
  if (!fontBoldBytes) {
    const res = await fetch(FONT_BOLD_URL, { cache: "force-cache" });
    if (!res.ok) throw new Error("Failed to load Sarabun Bold font");
    fontBoldBytes = new Uint8Array(await res.arrayBuffer());
  }
  return { regular: fontRegularBytes, bold: fontBoldBytes };
}

// Draw centered text, auto-shrink if too wide
function drawCenteredText(
  page: PDFPage,
  text: string,
  font: PDFFont,
  maxSize: number,
  minSize: number,
  y: number,
  maxWidth: number,
  color: { r: number; g: number; b: number },
) {
  let size = maxSize;
  while (size > minSize) {
    const w = font.widthOfTextAtSize(text, size);
    if (w <= maxWidth) break;
    size -= 0.5;
  }
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: (PAGE_W - w) / 2,
    y,
    size,
    font,
    color: rgb(color.r, color.g, color.b),
  });
  return size;
}

async function generateNameplatePdf(job: NameplateJob): Promise<Uint8Array> {
  const { regular, bold } = await loadFonts();

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit as Parameters<typeof pdfDoc.registerFontkit>[0]);

  const fontRegular = await pdfDoc.embedFont(regular);
  const fontBold    = await pdfDoc.embedFont(bold);

  const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  const padH = 24; // horizontal padding (pt)
  const textW = PAGE_W - padH * 2;
  const gold = { r: 0.788, g: 0.608, b: 0.231 };   // #c9a03b
  const dark = { r: 0.102, g: 0.102, b: 0.102 };   // #1a1a1a
  const grey = { r: 0.533, g: 0.533, b: 0.533 };   // #888

  // Background: white
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: rgb(1, 1, 1) });

  // Gold border (2pt inset)
  const bInset = 4;
  page.drawRectangle({
    x: bInset, y: bInset,
    width: PAGE_W - bInset * 2, height: PAGE_H - bInset * 2,
    borderColor: rgb(gold.r, gold.g, gold.b),
    borderWidth: 1.5,
    color: rgb(0.996, 0.976, 0.933),  // cream #fef9ee
  });
  // Inner border (thin, no fill)
  const b2 = bInset + 4;
  page.drawRectangle({
    x: b2, y: b2,
    width: PAGE_W - b2 * 2, height: PAGE_H - b2 * 2,
    borderColor: rgb(gold.r, gold.g, gold.b),
    borderWidth: 0.4,
    opacity: 0.4,
    color: rgb(0.996, 0.976, 0.933),
  });

  // Header label: "หรีดร่วมบุญ · ใบร่วมบุญ"
  drawCenteredText(page, "หรีดร่วมบุญ · ใบร่วมบุญ", fontRegular, 8, 6, PAGE_H - 22, textW, grey);

  // Memorial name
  const memName = job.memorialName || "งานศพ";
  drawCenteredText(page, `งาน ${memName}`, fontRegular, 9, 7, PAGE_H - 36, textW, { r: 0.35, g: 0.35, b: 0.35 });

  // Gold divider line
  const divY = PAGE_H - 46;
  const divLen = 80;
  page.drawLine({
    start: { x: (PAGE_W - divLen) / 2, y: divY },
    end:   { x: (PAGE_W + divLen) / 2, y: divY },
    thickness: 0.75,
    color: rgb(gold.r, gold.g, gold.b),
    opacity: 0.8,
  });

  // Donor name (large, bold)
  const nameY = PAGE_H / 2 + 8;
  drawCenteredText(page, job.donorName, fontBold, 22, 10, nameY, textW, dark);

  // Donor title (if any)
  if (job.donorTitle) {
    drawCenteredText(page, job.donorTitle, fontRegular, 11, 7, nameY - 20, textW, { r: 0.4, g: 0.4, b: 0.4 });
  }

  // Amount
  const amountY = job.donorTitle ? nameY - 38 : nameY - 22;
  drawCenteredText(
    page,
    `ร่วมบุญ ${job.amount.toLocaleString("th-TH")} บาท`,
    fontBold,
    12,
    8,
    amountY,
    textW,
    gold,
  );

  // Footer
  drawCenteredText(page, "ขอบพระคุณจากเจ้าภาพ", fontRegular, 8, 6, 18, textW, grey);

  return pdfDoc.save();
}

async function uploadPdfToStorage(pdfBytes: Uint8Array, donationId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const path = `nameplates/${donationId}.pdf`;

  const { error } = await supabase.storage
    .from("donations")
    .upload(path, pdfBytes, { contentType: "application/pdf", upsert: true });

  if (error) {
    console.error("PDF upload error:", error.message);
    return null;
  }

  // Signed URL valid 30 minutes (PrintNode needs to download within this window)
  const { data } = await supabase.storage.from("donations").createSignedUrl(path, 60 * 30);
  return data?.signedUrl ?? null;
}

export interface NameplateJob {
  printerId: string;
  donorTitle: string;
  donorName: string;
  amount: number;
  memorialName: string;
  donationId?: string;
}

export async function sendPrintJob(job: NameplateJob): Promise<{ ok: boolean; jobId?: number; error?: string }> {
  const apiKey = process.env.PRINTNODE_API_KEY;
  if (!apiKey) return { ok: false, error: "PRINTNODE_API_KEY not set" };

  // 1. Generate PDF
  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await generateNameplatePdf(job);
  } catch (e) {
    return { ok: false, error: `PDF generation failed: ${String(e)}` };
  }

  // 2. Upload to Supabase storage → signed URL
  const storageId = job.donationId ?? `${Date.now()}`;
  const pdfUrl = await uploadPdfToStorage(pdfBytes, storageId);
  if (!pdfUrl) return { ok: false, error: "PDF upload to storage failed" };

  // 3. Send to PrintNode as pdf_uri
  const payload = {
    printerId: Number(job.printerId),
    title: `ป้าย: ${job.donorName}`,
    contentType: "pdf_uri",
    content: pdfUrl,
    source: "หรีดร่วมบุญ",
    options: { copies: 1 },
  };

  try {
    const res = await fetch(`${PRINTNODE_API}/printjobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `PrintNode ${res.status}: ${text}` };
    }

    const jobId = await res.json();
    return { ok: true, jobId };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
