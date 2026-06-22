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
const MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5";
const IMAGE_SIZE = process.env.OPENAI_IMAGE_SIZE || "1024x1024";
const IMAGE_QUALITY = process.env.OPENAI_IMAGE_QUALITY || "high";
const IMAGE_OUTPUT_FORMAT = process.env.OPENAI_IMAGE_OUTPUT_FORMAT || "jpeg";
const IMAGE_OUTPUT_COMPRESSION = process.env.OPENAI_IMAGE_OUTPUT_COMPRESSION || "72";
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

function unsupportedParameterFromMessage(message) {
  return (
    message.match(/does not support the '([^']+)' parameter/i)?.[1] ||
    message.match(/unknown parameter: '?([^'.]+)'?/i)?.[1] ||
    null
  );
}

async function parseImageResponse(response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error?.message || data?.message || `OpenAI error ${response.status}`);
  }

  const fmt = data.output_format || IMAGE_OUTPUT_FORMAT;
  const images = (data.data || [])
    .map((item) =>
      item.b64_json
        ? `data:image/${fmt};base64,${item.b64_json}`
        : item.url
    )
    .filter(Boolean);

  if (!images.length) throw new Error("No images returned from OpenAI");
  return images;
}

async function postOpenAIJson(endpoint, payload) {
  const body = { ...payload };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`https://api.openai.com/v1/images/${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(180_000),
    });

    if (response.ok) return parseImageResponse(response);

    const data = await response.json().catch(() => null);
    const message = data?.error?.message || data?.message || `OpenAI error ${response.status}`;
    const unsupported = unsupportedParameterFromMessage(message);
    if (unsupported && Object.prototype.hasOwnProperty.call(body, unsupported)) {
      delete body[unsupported];
      continue;
    }

    throw new Error(message);
  }

  throw new Error("OpenAI image request failed after removing unsupported parameters");
}

async function postOpenAIForm(endpoint, createFormData) {
  const skipped = new Set();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const formData = createFormData(skipped);
    const response = await fetch(`https://api.openai.com/v1/images/${endpoint}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: formData,
      signal: AbortSignal.timeout(180_000),
    });

    if (response.ok) return parseImageResponse(response);

    const data = await response.json().catch(() => null);
    const message = data?.error?.message || data?.message || `OpenAI error ${response.status}`;
    const unsupported = unsupportedParameterFromMessage(message);
    if (unsupported && !skipped.has(unsupported)) {
      skipped.add(unsupported);
      continue;
    }

    throw new Error(message);
  }

  throw new Error("OpenAI image request failed after removing unsupported parameters");
}

// ── POST /generate ────────────────────────────────────────────────────────────
app.post("/generate", upload.fields([
  { name: "donor_photo", maxCount: 1 },
  { name: "host_photo",  maxCount: 1 },
]), async (req, res) => {
  if (!verifyToken(req.headers.authorization)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!OPENAI_API_KEY) {
    return res.status(503).json({ error: "OPENAI_API_KEY is not configured" });
  }

  const prompt = req.body?.prompt;
  const count = Math.min(4, Math.max(1, parseInt(req.body?.count || "1", 10)));
  const files = req.files || {};
  const donorPhoto = Array.isArray(files.donor_photo) ? files.donor_photo[0] : null;
  const hostPhoto  = Array.isArray(files.host_photo)  ? files.host_photo[0]  : null;

  if (!prompt) return res.status(400).json({ error: "prompt is required" });

  console.log(`[generate] count=${count} hasPhoto=${!!donorPhoto} model=${MODEL} size=${IMAGE_SIZE} quality=${IMAGE_QUALITY}`);

  try {
    let images;

    if (donorPhoto && donorPhoto.size > 0) {
      // Image edit — use donor photo (+ optional host photo) as reference
      images = await postOpenAIForm("edits", (skipped) => {
        const formData = new FormData();
        formData.append("model", MODEL);
        formData.append("prompt", prompt);
        formData.append("n", String(count));
        formData.append("size", IMAGE_SIZE);
        formData.append("quality", IMAGE_QUALITY);
        if (!skipped.has("output_format")) formData.append("output_format", IMAGE_OUTPUT_FORMAT);
        if (!skipped.has("output_compression")) formData.append("output_compression", IMAGE_OUTPUT_COMPRESSION);
        const blob = new Blob([donorPhoto.buffer], {
          type: donorPhoto.mimetype || "image/jpeg",
        });
        formData.append("image", blob, donorPhoto.originalname || "donor-photo.jpg");
        if (hostPhoto && hostPhoto.size > 0) {
          const hostBlob = new Blob([hostPhoto.buffer], { type: hostPhoto.mimetype || "image/jpeg" });
          formData.append("image", hostBlob, hostPhoto.originalname || "host-photo.jpg");
        }
        return formData;
      });
    } else {
      // Text-to-image generation
      images = await postOpenAIJson("generations", {
        model: MODEL,
        prompt,
        n: count,
        size: IMAGE_SIZE,
        quality: IMAGE_QUALITY,
        output_format: IMAGE_OUTPUT_FORMAT,
        output_compression: Number(IMAGE_OUTPUT_COMPRESSION),
      });
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
  console.log(`AI service ready on port ${PORT} | model=${MODEL} size=${IMAGE_SIZE} quality=${IMAGE_QUALITY}`);
});
