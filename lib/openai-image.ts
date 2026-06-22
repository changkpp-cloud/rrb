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

const DEFAULT_OPENAI_IMAGE_SIZE = "1024x1024";
const DEFAULT_OPENAI_IMAGE_QUALITY = "high";
const DEFAULT_OPENAI_IMAGE_OUTPUT_FORMAT = "jpeg";
const DEFAULT_OPENAI_IMAGE_OUTPUT_COMPRESSION = 72;
const OPENAI_IMAGE_TIMEOUT_MS = 180_000; // bumped for high-quality edit
const DEFAULT_OPENAI_IMAGE_MODEL = "gpt-image-1.5";
const SUPPORTED_OPENAI_IMAGE_MODELS = new Set([
  "gpt-image-1.5",
  "gpt-image-1",
  "gpt-image-1-mini",
]);
const SUPPORTED_OPENAI_IMAGE_QUALITIES = new Set(["low", "medium", "high", "auto"]);
const SUPPORTED_OPENAI_IMAGE_OUTPUT_FORMATS = new Set(["png", "jpeg", "webp"]);

function envChoice(name: string, fallback: string, supported?: Set<string>) {
  const value = process.env[name]?.trim();
  if (!value) return fallback;
  if (supported && !supported.has(value)) return fallback;
  return value;
}

function envNumber(name: string, fallback: number, min: number, max: number) {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function imageResultToUrl(item: OpenAIImageItem, outputFormat: string) {
  if (item.b64_json) return `data:image/${outputFormat};base64,${item.b64_json}`;
  return item.url ?? "";
}

function unsupportedParameterFromMessage(message: string) {
  return (
    message.match(/does not support the '([^']+)' parameter/i)?.[1] ??
    message.match(/unknown parameter: '?([^'.]+)'?/i)?.[1] ??
    null
  );
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

  const outputFormat = data?.output_format ?? getOpenAIImageOutputFormat();
  const images = (data?.data ?? [])
    .map((item) => imageResultToUrl(item, outputFormat))
    .filter(Boolean);

  if (images.length === 0) {
    throw new Error("ไม่ได้รับรูปภาพจาก OpenAI");
  }

  return images;
}

async function parseOpenAIError(res: Response) {
  const data = (await res.json().catch(() => null)) as OpenAIImageResponse | null;
  return (
    data?.error?.message ??
    data?.message ??
    `OpenAI image request failed (${res.status})`
  );
}

function getImageSignal() {
  return AbortSignal.timeout(OPENAI_IMAGE_TIMEOUT_MS);
}

export function getOpenAIImageModel() {
  const model = process.env.OPENAI_IMAGE_MODEL || DEFAULT_OPENAI_IMAGE_MODEL;
  return SUPPORTED_OPENAI_IMAGE_MODELS.has(model)
    ? model
    : DEFAULT_OPENAI_IMAGE_MODEL;
}

function getOpenAIImageSize() {
  return process.env.OPENAI_IMAGE_SIZE?.trim() || DEFAULT_OPENAI_IMAGE_SIZE;
}

function getOpenAIImageGenerateQuality() {
  return envChoice(
    "OPENAI_IMAGE_QUALITY_GENERATE",
    envChoice("OPENAI_IMAGE_QUALITY", DEFAULT_OPENAI_IMAGE_QUALITY, SUPPORTED_OPENAI_IMAGE_QUALITIES),
    SUPPORTED_OPENAI_IMAGE_QUALITIES
  );
}

function getOpenAIImageEditQuality() {
  return envChoice(
    "OPENAI_IMAGE_QUALITY_EDIT",
    envChoice("OPENAI_IMAGE_QUALITY", DEFAULT_OPENAI_IMAGE_QUALITY, SUPPORTED_OPENAI_IMAGE_QUALITIES),
    SUPPORTED_OPENAI_IMAGE_QUALITIES
  );
}

function getOpenAIImageOutputFormat() {
  return envChoice(
    "OPENAI_IMAGE_OUTPUT_FORMAT",
    DEFAULT_OPENAI_IMAGE_OUTPUT_FORMAT,
    SUPPORTED_OPENAI_IMAGE_OUTPUT_FORMATS
  );
}

function getOpenAIImageOutputCompression() {
  return envNumber("OPENAI_IMAGE_OUTPUT_COMPRESSION", DEFAULT_OPENAI_IMAGE_OUTPUT_COMPRESSION, 0, 100);
}

async function postOpenAIJson(endpoint: string, payload: Record<string, unknown>) {
  const body = { ...payload };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const res = await fetch(`https://api.openai.com/v1/images/${endpoint}`, {
      method: "POST",
      signal: getImageSignal(),
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.ok) return parseOpenAIResponse(res);

    const message = await parseOpenAIError(res);
    const unsupported = unsupportedParameterFromMessage(message);
    if (unsupported && unsupported in body) {
      delete body[unsupported];
      continue;
    }

    throw new Error(message);
  }

  throw new Error("OpenAI image request failed after removing unsupported parameters");
}

async function postOpenAIForm(endpoint: string, body: FormData) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const res = await fetch(`https://api.openai.com/v1/images/${endpoint}`, {
      method: "POST",
      signal: getImageSignal(),
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body,
    });

    if (res.ok) return parseOpenAIResponse(res);

    const message = await parseOpenAIError(res);
    const unsupported = unsupportedParameterFromMessage(message);
    if (unsupported && body.has(unsupported)) {
      body.delete(unsupported);
      continue;
    }

    throw new Error(message);
  }

  throw new Error("OpenAI image request failed after removing unsupported parameters");
}

export async function generateOpenAIImage(prompt: string, count = 1) {
  return postOpenAIJson("generations", {
    model: getOpenAIImageModel(),
    prompt,
    n: count,
    size: getOpenAIImageSize(),
    quality: getOpenAIImageGenerateQuality(),
    output_format: getOpenAIImageOutputFormat(),
    output_compression: getOpenAIImageOutputCompression(),
  });
}

export async function editOpenAIImage(prompt: string, imageInput: File | File[], count = 1) {
  const images = Array.isArray(imageInput) ? imageInput : [imageInput];
  const image = images[0];
  if (!image) throw new Error("No reference image provided");
  for (const referenceImage of images) {
    if (referenceImage.size > 50 * 1024 * 1024) {
      throw new Error("รูปอ้างอิงต้องมีขนาดไม่เกิน 50MB");
    }
  }

  const body = new FormData();
  body.append("model", getOpenAIImageModel());
  body.append("prompt", prompt);
  body.append("n", String(count));
  body.append("size", getOpenAIImageSize());
  body.append("quality", getOpenAIImageEditQuality());
  body.append("output_format", getOpenAIImageOutputFormat());
  body.append("output_compression", String(getOpenAIImageOutputCompression()));
  if (images.length === 1) {
    body.append("image", image, image.name || "donor-photo.jpg");
  } else {
    images.forEach((referenceImage, index) => {
      body.append("image", referenceImage, referenceImage.name || `reference-${index + 1}.jpg`);
    });
  }

  return postOpenAIForm("edits", body);
}
