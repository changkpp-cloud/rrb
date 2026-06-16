export const DEFAULT_CENTER_DAILY_DONATION_LIMIT = 1000;

export type PublicDonation = {
  id: string;
  memorial_id: string;
  center_id?: string | null;
  donor_name: string;
  donor_title?: string | null;
  amount: number;
  message?: string | null;
  status: string;
  nameplate_status?: string | null;
  created_at: string;
};

export function getCenterDailyDonationLimit(envValue = process.env.CENTER_DAILY_DONATION_LIMIT) {
  const parsed = Number(envValue ?? DEFAULT_CENTER_DAILY_DONATION_LIMIT);
  if (!Number.isFinite(parsed) || parsed < 100) return DEFAULT_CENTER_DAILY_DONATION_LIMIT;
  return Math.floor(parsed);
}

export function isCenterDailyLimitReached(currentCount: number, limit = getCenterDailyDonationLimit()) {
  return currentCount >= limit;
}

export function bangkokDateWindow(now = new Date()) {
  const bangkokNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
  const startBangkok = new Date(bangkokNow);
  startBangkok.setHours(0, 0, 0, 0);
  const endBangkok = new Date(startBangkok);
  endBangkok.setDate(endBangkok.getDate() + 1);

  const offsetMs = bangkokNow.getTime() - now.getTime();
  return {
    start: new Date(startBangkok.getTime() - offsetMs).toISOString(),
    end: new Date(endBangkok.getTime() - offsetMs).toISOString(),
  };
}

export function toPublicDonation(row: Record<string, any>): PublicDonation {
  return {
    id: row.id,
    memorial_id: row.memorial_id,
    center_id: row.center_id ?? null,
    donor_name: row.donor_name,
    donor_title: row.donor_title ?? null,
    amount: row.amount,
    message: row.message ?? null,
    status: row.status,
    nameplate_status: row.nameplate_status ?? null,
    created_at: row.created_at,
  };
}
