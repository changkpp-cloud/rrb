export const SITE_URL = "https://rrb.center";

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || SITE_URL).replace(/\/$/, "");
}
