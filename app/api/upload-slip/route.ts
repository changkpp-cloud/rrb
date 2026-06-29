import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHash } from "crypto";

const MAX_SLIP_SIZE = 5 * 1024 * 1024;
// สลิปโอนเงินจริงจากแอปธนาคาร (บันทึก/แชร์/แคปหน้าจอ) เป็นรูป JPG หรือ PNG เสมอ
// ถ้าไม่ใช่ 2 แบบนี้ (เช่น HEIC, PDF, webp) ถือว่าไม่ใช่สลิปจริง → ปฏิเสธ
const ALLOWED_SLIP_TYPES = new Set(["image/jpeg", "image/png"]);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const memorial_id = formData.get("memorial_id") as string;
    const slipFile = formData.get("slip") as File | null;

    if (!memorial_id || !slipFile || slipFile.size === 0) {
      return NextResponse.json({ error: "Missing slip file or memorial_id" }, { status: 400 });
    }

    if (slipFile.size > MAX_SLIP_SIZE) {
      return NextResponse.json({ error: "Slip file is too large" }, { status: 413 });
    }

    if (!ALLOWED_SLIP_TYPES.has(slipFile.type)) {
      return NextResponse.json({ error: "Unsupported slip file type", not_a_slip: true }, { status: 415 });
    }

    const rawExt = slipFile.name.split(".").pop()?.toLowerCase();
    const ext = rawExt && /^[a-z0-9]+$/.test(rawExt) ? rawExt : "jpg";
    const fileName = `slips/${memorial_id}/${crypto.randomUUID()}.${ext}`;
    const buffer = Buffer.from(await slipFile.arrayBuffer());
    const slipHash = createHash("sha256").update(buffer).digest("hex");

    const supabase = createAdminClient();
    const { data: existingSubmission, error: duplicateLookupError } = await supabase.from("slip_submissions")
      .select("id")
      .eq("memorial_id", memorial_id)
      .eq("slip_hash", slipHash)
      .order("first_seen_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (duplicateLookupError) {
      console.error("Slip duplicate lookup error:", duplicateLookupError);
      return NextResponse.json({ error: "Failed to check slip duplicate" }, { status: 500 });
    }

    const duplicateDetected = Boolean(existingSubmission?.id);
    const { data: submission, error: reserveError } = await supabase.from("slip_submissions")
      .insert({
        memorial_id,
        slip_hash: slipHash,
        duplicate_detected: duplicateDetected,
        duplicate_of: existingSubmission?.id ?? null,
        review_status: duplicateDetected ? "needs_review" : "none",
      })
      .select("id")
      .single();

    if (reserveError) {
      console.error("Slip reservation error:", reserveError);
      return NextResponse.json({ error: "Failed to check slip duplicate" }, { status: 500 });
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("donations")
      .upload(fileName, buffer, { contentType: slipFile.type, upsert: false });

    if (uploadError) {
      if (submission?.id) {
        await supabase.from("slip_submissions").delete().eq("id", submission.id);
      }
      console.error("Slip upload error:", uploadError);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    await supabase.from("slip_submissions")
      .update({ slip_url: uploadData.path })
      .eq("id", submission.id);

    return NextResponse.json({
      slip_url: uploadData.path,
      slip_hash: slipHash,
      duplicate: duplicateDetected,
      duplicate_submission_id: existingSubmission?.id ?? null,
    });
  } catch (err) {
    console.error("upload-slip error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
