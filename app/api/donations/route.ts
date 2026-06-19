import { NextRequest, NextResponse } from "next/server";
import { hasHostSession } from "@/lib/host-session";
import { getCenterAccess } from "@/lib/iam";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyHost, msgNewDonation } from "@/lib/notify";
import { bangkokDateWindow, getCenterDailyDonationLimit, isCenterDailyLimitReached, toPublicDonation } from "@/lib/donation-policy";
import { createHash } from "crypto";

const MAX_SLIP_SIZE = 5 * 1024 * 1024;
const ALLOWED_SLIP_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

type MemorialInfo = {
  center_id?: string | null;
  host_phone?: string | null;
  name?: string | null;
};

function extensionFor(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext && /^[a-z0-9]+$/.test(ext)) return ext;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "application/pdf") return "pdf";
  return "jpg";
}

async function uploadLegacySlip(memorialId: string, slipFile: File): Promise<{ path: string; hash: string; duplicate: boolean } | null> {
  if (slipFile.size > MAX_SLIP_SIZE || !ALLOWED_SLIP_TYPES.has(slipFile.type)) {
    return null;
  }

  const supabase = createAdminClient();
  const ext = extensionFor(slipFile);
  const fileName = `slips/${memorialId}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await slipFile.arrayBuffer());
  const hash = createHash("sha256").update(buffer).digest("hex");

  const { data: existingSubmission, error: duplicateLookupError } = await supabase.from("slip_submissions")
    .select("id")
    .eq("memorial_id", memorialId)
    .eq("slip_hash", hash)
    .order("first_seen_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (duplicateLookupError) return null;

  const duplicateDetected = Boolean(existingSubmission?.id);
  const { data: submission, error: reserveError } = await supabase.from("slip_submissions")
    .insert({
      memorial_id: memorialId,
      slip_hash: hash,
      duplicate_detected: duplicateDetected,
      duplicate_of: existingSubmission?.id ?? null,
      review_status: duplicateDetected ? "needs_review" : "none",
    })
    .select("id")
    .single();

  if (reserveError) return null;

  const { data, error } = await supabase.storage
    .from("donations")
    .upload(fileName, buffer, { contentType: slipFile.type, upsert: false });

  if (error) {
    if (submission?.id) {
      await supabase.from("slip_submissions").delete().eq("id", submission.id);
    }
    return null;
  }

  await supabase.from("slip_submissions")
    .update({ slip_url: data.path })
    .eq("id", submission.id);

  return { path: data.path, hash, duplicate: duplicateDetected };
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let memorial_id = "";
    let donor_name = "";
    let donor_title: string | null = null;
    let amount = 0;
    let message: string | null = null;
    let slip_url: string | null = null;
    let slip_hash: string | null = null;
    let slip_duplicate_warning = false;

    if (contentType.includes("application/json")) {
      const body = await request.json();
      memorial_id = body.memorial_id ?? "";
      donor_name = body.donor_name ?? "";
      donor_title = body.donor_title || null;
      amount = parseFloat(body.amount) || 0;
      message = body.message || null;
      slip_url = body.slip_url || null;
      slip_hash = body.slip_hash || null;
      slip_duplicate_warning = Boolean(body.slip_duplicate_warning || body.duplicate);
    } else {
      const formData = await request.formData();
      memorial_id = (formData.get("memorial_id") as string) ?? "";
      donor_name = (formData.get("donor_name") as string) ?? "";
      donor_title = (formData.get("donor_title") as string) || null;
      amount = parseFloat((formData.get("amount") as string) || "0");
      message = (formData.get("message") as string) || null;

      const slipFile = formData.get("slip") as File | null;
      if (slipFile && slipFile.size > 0) {
        const uploaded = await uploadLegacySlip(memorial_id, slipFile);
        slip_url = uploaded?.path ?? null;
        slip_hash = uploaded?.hash ?? null;
        slip_duplicate_warning = uploaded?.duplicate ?? false;
      }
    }

    if (!memorial_id || !donor_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: memorial } = await supabase
      .from("memorials")
      .select("center_id, host_phone, name")
      .eq("id", memorial_id)
      .single();

    if (!memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 });
    }

    const memorialInfo = memorial as MemorialInfo;
    if (memorialInfo.center_id) {
      const { start, end } = bangkokDateWindow();
      const { count, error: countError } = await supabase
        .from("donations")
        .select("id", { count: "exact", head: true })
        .eq("center_id", memorialInfo.center_id)
        .gte("created_at", start)
        .lt("created_at", end);

      if (countError) {
        console.error("Daily donation count error:", countError);
        return NextResponse.json({ error: "Failed to check center quota" }, { status: 500 });
      }

      const dailyLimit = getCenterDailyDonationLimit();
      if (isCenterDailyLimitReached(count ?? 0, dailyLimit)) {
        return NextResponse.json(
          { error: "Center daily donation limit reached", limit: dailyLimit },
          { status: 429 },
        );
      }
    }

    const acceptedAt = new Date().toISOString();
    const insertPayload = {
      memorial_id,
      center_id: memorialInfo.center_id ?? null,
      donor_name,
      donor_title: donor_title ?? null,
      amount,
      message: message ?? null,
      slip_url: slip_url ?? null,
      slip_hash: slip_hash ?? null,
      slip_duplicate_warning,
      status: "confirmed" as const,
      confirmed_at: acceptedAt,
    };

    const { data, error } = await supabase.from("donations")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);

      if (error.message.includes("Could not find")) {
        const { data: data2, error: error2 } = await supabase.from("donations")
          .insert({
            memorial_id,
            donor_name,
            amount,
            message: message ?? null,
            slip_url: slip_url ?? null,
            status: "confirmed" as const,
          })
          .select()
          .single();

        if (error2) {
          return NextResponse.json({ error: "Failed to save donation" }, { status: 500 });
        }
        return NextResponse.json({ success: true, donation: data2 });
      }

      return NextResponse.json({ error: "Failed to save donation" }, { status: 500 });
    }

    notifyHost({
      hostPhone: memorialInfo.host_phone ?? null,
      message: msgNewDonation({
        memorialName: memorialInfo.name ?? "งานศพ",
        donorName: donor_name,
        donorTitle: donor_title,
        amount,
        hostId: memorial_id,
      }),
    }).catch(() => {});

    return NextResponse.json({ success: true, donation: data });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const memorial_id = searchParams.get("memorial_id");
  const center_id = searchParams.get("center_id");

  const supabase = createAdminClient();
  if (memorial_id) {
    const { data: memorial } = await supabase
      .from("memorials")
      .select("center_id")
      .eq("id", memorial_id)
      .maybeSingle();
    const centerId = (memorial as { center_id?: string | null } | null)?.center_id ?? null;
    const hostAllowed = await hasHostSession(memorial_id);
    const centerAllowed = centerId ? (await getCenterAccess(centerId)).allowed : false;
    if (!hostAllowed && !centerAllowed) {
      return NextResponse.json({ error: "Donation access denied" }, { status: 403 });
    }
  } else if (center_id) {
    const access = await getCenterAccess(center_id);
    if (!access.allowed) {
      return NextResponse.json({ error: "Donation access denied" }, { status: 403 });
    }
  } else {
    return NextResponse.json({ error: "memorial_id or center_id required" }, { status: 400 });
  }

  let query = supabase
    .from("donations")
    .select("id, memorial_id, center_id, donor_name, donor_title, amount, message, status, nameplate_status, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (memorial_id) query = query.eq("memorial_id", memorial_id);
  if (center_id) query = query.eq("center_id", center_id);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }

  return NextResponse.json((data ?? []).map((row: Record<string, any>) => toPublicDonation(row)));
}
