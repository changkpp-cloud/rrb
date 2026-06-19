import { NextResponse } from "next/server";

const CHECKED_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "CRON_SECRET",
  "PAYMENT_WEBHOOK_SECRET",
  "PRINT_SERVICE_URL",
] as const;

type CheckedVar = (typeof CHECKED_VARS)[number];

type HealthResponse = {
  status: "ok";
  timestamp: string;
  env: Record<CheckedVar, boolean>;
};

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const env = Object.fromEntries(
    CHECKED_VARS.map((key) => [key, Boolean(process.env[key])])
  ) as Record<CheckedVar, boolean>;

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env,
  });
}
