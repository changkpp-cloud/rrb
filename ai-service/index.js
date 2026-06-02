// ai-service — standalone Node.js server for OpenAI image generation
// Deploy on Railway / Render (no timeout restrictions)
// Node.js >= 20 required (native fetch + FormData + Blob)

const express = require("express");
const multer = require("multer");
const { createHmac, timingSafeEqual } = require("crypto");

const app = express();
const PORT = process.env.PORT || 3001;

const AI_SERVICE_SECRET = process.env.AI_SERVICE_SECRET;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
const IMAGE_SIZE = process.env.OPENAI_IMAGE_SIZE || "1024x1536";
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

if (!AI_SERVICE_SECRET) console.warn("[warn] AI_SERVICE_SECRET is not set — all requests will be rejected");
if (!OPENAI_API_KEY) console.warn("[warn] OPENAI_API_KEY is not set");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
});

// ── Token verification (HMAC-SHA256, matches lib/admin-session.ts pattern) ───
function verifyToken(authHeader) {
  if (!AI_SERVICE_SECRET) return false;
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return false;
    const payload = token.slice(0, dot);
    const sigHex = token.slice(dot + 1);
    const expectedHex = createHmac("sha256", AI_SERVICE_SECRET)
      .update(payload)
      .digest("hex");
    if (sigHex.length !== 64 || expectedHex.length !== 64) return false;
    if (!timingSafeEqual(Buffer.from(sigHex, "hex"), Buffer.from(expectedHex, "hex")))
      return false;
    const exp = parseInt(payload.split(":")[1], 10);
    return Number.isFinite(exp) && Date.now() / 1000 < exp;
  } catch {
    return false;
  }
}

// ── POST /generate ────────────────────────────────────────────────────────────
app.post("/generate", upload.single("donor_photo"), async (req, res) => {
  if (!verifyToken(req.headers.authorization)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!OPENAI_API_KEY) {
    return res.status(503).json({ error: "OPENAI_API_KEY is not configured" });
  }

  const prompt = req.body?.prompt;
  const count = Math.min(4, Math.max(1, parseInt(req.body?.count || "1", 10)));
  const donorPhoto = req.file;

  if (!prompt) return res.status(400).json({ error: "prompt is required" });

  console.log(`[generate] count=${count} hasPhoto=${!!donorPhoto} model=${MODEL}`);

  try {
    let images;

    if (donorPhoto && donorPhoto.size > 0) {
      // Image edit — use donor photo as face reference
      const formData = new FormData();
      formData.append("model", MODEL);
      formData.append("prompt", prompt);
      formData.append("n", String(count));
      formData.append("size", IMAGE_SIZE);
      formData.append("quality", "high");
      formData.append("output_format", "jpeg");
      formData.append("output_compression", "85");
      const blob = new Blob([donorPhoto.buffer], {
        type: donorPhoto.mimetype || "image/jpeg",
      });
      formData.append("image", blob, donorPhoto.originalname || "donor-photo.jpg");

      const r = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
        body: formData,
        signal: AbortSignal.timeout(180_000),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error?.message || `OpenAI error ${r.status}`);
      const fmt = data.output_format || "jpeg";
      images = (data.data || [])
        .map((item) =>
          item.b64_json
            ? `data:image/${fmt};base64,${item.b64_json}`
            : item.url
        )
        .filter(Boolean);
    } else {
      // Text-to-image generation
      const r = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          prompt,
          n: count,
          size: IMAGE_SIZE,
          quality: "high",
          output_format: "jpeg",
          output_compression: 85,
        }),
        signal: AbortSignal.timeout(180_000),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error?.message || `OpenAI error ${r.status}`);
      const fmt = data.output_format || "jpeg";
      images = (data.data || [])
        .map((item) =>
          item.b64_json
            ? `data:image/${fmt};base64,${item.b64_json}`
            : item.url
        )
        .filter(Boolean);
    }

    if (!images || images.length === 0) {
      throw new Error("No images returned from OpenAI");
    }

    console.log(`[generate] done — ${images.length} image(s)`);
    res.json({ images, url: images[0] });
  } catch (err) {
    console.error("[generate] error:", err.message);
    res.status(500).json({ error: err.message || "เกิดข้อผิดพลาดระหว่างสร้างภาพ" });
  }
});

// ── GET /health ───────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok", model: MODEL }));

app.listen(PORT, () => {
  console.log(`AI service ready on port ${PORT} | model=${MODEL} size=${IMAGE_SIZE}`);
});
