export const SITE_URL = "https://rrb.center";

export function getSiteUrl() {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  // เมินโดเมน vercel (preview/อัตโนมัติ) — ใช้โดเมนจริง rrb.center เสมอ
  if (env && !/vercel\.app$/i.test(env)) return env;
  return SITE_URL;
}
