type OpenAIImageItem = {
  b64_json?: string;
  url?: string;
};

type OpenAIImageResponse = {
  data?: OpenAIImageItem[];
  error?: { message?: string };
  message?: string;
  output_format?: "png" | "jpeg" | "webp";
};

const OPENAI_IMAGE_SIZE = "1024x1536"; // portrait 2:3 — matches display aspect ratio
const OPENAI_IMAGE_QUALITY_GENERATE = "low";
const OPENAI_IMAGE_QUALITY_EDIT = "high"; // high for face-reference edits
const OPENAI_IMAGE_OUTPUT_FORMAT = "jpeg";
const OPENAI_IMAGE_OUTPUT_COMPRESSION = 85;
const OPENAI_IMAGE_TIMEOUT_MS = 180_000; // bumped for high-quality edit

function imageResultToUrl(item: OpenAIImageItem, outputFormat: string) {
  if (item.b64_json) return `data:image/${outputFormat};base64,${item.b64_json}`;
  return item.url ?? "";
}

async function parseOpenAIResponse(res: Response) {
  const data = (await res.json().catch(() => null)) as OpenAIImageResponse | null;
  if (!res.ok) {
    const message =
      data?.error?.message ??
      data?.message ??
      `OpenAI image request failed (${res.status})`;
    throw new Error(message);
  }

  const outputFormat = data?.output_format ?? OPENAI_IMAGE_OUTPUT_FORMAT;
  const images = (data?.data ?? [])
    .map((item) => imageResultToUrl(item, outputFormat))
    .filter(Boolean);

  if (images.length === 0) {
    throw new Error("ไม่ได้รับรูปภาพจาก OpenAI");
  }

  return images;
}

function getImageSignal() {
  return AbortSignal.timeout(OPENAI_IMAGE_TIMEOUT_MS);
}

export function getOpenAIImageModel() {
  return process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
}

export async function generateOpenAIImage(prompt: string, count = 1) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    signal: getImageSignal(),
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getOpenAIImageModel(),
      prompt,
      n: count,
      size: OPENAI_IMAGE_SIZE,
      quality: OPENAI_IMAGE_QUALITY_GENERATE,
      output_format: OPENAI_IMAGE_OUTPUT_FORMAT,
      output_compression: OPENAI_IMAGE_OUTPUT_COMPRESSION,
    }),
  });

  return parseOpenAIResponse(res);
}

export async function editOpenAIImage(prompt: string, image: File, count = 1) {
  if (image.size > 50 * 1024 * 1024) {
    throw new Error("รูปผู้มอบต้องมีขนาดไม่เกิน 50MB");
  }

  const body = new FormData();
  body.append("model", getOpenAIImageModel());
  body.append("prompt", prompt);
  body.append("n", String(count));
  body.append("size", OPENAI_IMAGE_SIZE);
  body.append("quality", OPENAI_IMAGE_QUALITY_EDIT);
  body.append("output_format", OPENAI_IMAGE_OUTPUT_FORMAT);
  body.append("output_compression", String(OPENAI_IMAGE_OUTPUT_COMPRESSION));
  body.append("image", image, image.name || "donor-photo.jpg");

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    signal: getImageSignal(),
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body,
  });

  return parseOpenAIResponse(res);
}
