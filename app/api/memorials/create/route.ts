import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function rand(n: number) {
  let s = "";
  for (let i = 0; i < n; i++) s += CHARS[Math.floor(Math.random() * CHARS.length)];
  return s;
}

function generateEventCode(ceYear: number): string {
  return `EVT-${ceYear}-${rand(4)}`;
}

function generateHostCode(): string {
  return `H${rand(5)}`;
}

async function uploadFile(
  supabase: ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>,
  file: File,
  folder: string
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${folder}/${Date.now()}-${rand(4)}.${ext}`;
  const { error } = await supabase.storage.from("memorials").upload(path, file, { contentType: file.type });
  if (error) return null;
  return supabase.storage.from("memorials").getPublicUrl(path).data.publicUrl;
}

// Columns present in the base schema (supabase/schema.sql)
const BASE_COLUMNS = new Set([
  "slug", "name", "birth_date", "death_date", "age", "photo_url",
  "ceremony_date", "ceremony_time", "ceremony_location", "ceremony_hall",
  "bank_name", "bank_account_number", "bank_account_name",
  "bank_account_image_url", "is_active",
]);

// Extra columns added by migration_add_columns.sql
const EXTRA_COLUMNS = new Set([
  "event_code", "center_id", "funeral_status",
  "host_name", "host_phone", "host_code", "host_relationship",
  "prayer_date", "prayer_location",
  "host_bank_name", "host_bank_account_number", "host_bank_account_name",
]);

async function getAvailableColumns(supabase: ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>): Promise<Set<string>> {
  // Probe by selecting a single row; columns in error message tells us what exists
  // Simpler: try inserting with extra columns, fall back to base only on error
  return new Set([...BASE_COLUMNS, ...EXTRA_COLUMNS]);
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const supabase = createAdminClient();

    const centerId    = form.get("center_id") as string | null;
    const name        = (form.get("name") as string)?.trim();
    const birthDate   = form.get("birth_date") as string;
    const deathDate   = form.get("death_date") as string;
    const age         = parseInt(form.get("age") as string) || 0;

    const ceremonyDate     = form.get("ceremony_date") as string;
    const ceremonyTime     = (form.get("ceremony_time") as string) || "";
    const ceremonyLocation = (form.get("ceremony_location") as string) || "";
    const ceremonyHall     = (form.get("ceremony_hall") as string) || null;
    const prayerSchedule   = (form.get("prayer_schedule") as string) || null;
    const prayerText       = (form.get("prayer_text") as string) || null;

    const hostName         = (form.get("host_name") as string) || null;
    const hostPhone        = (form.get("host_phone") as string) || null;
    const hostRelationship = (form.get("host_relationship") as string) || null;

    const bankName          = (form.get("bank_name") as string) || "ธนาคารกรุงไทย\nKrungthai Bank";
    const bankAccountNumber = (form.get("bank_account_number") as string) || "";
    const bankAccountName   = (form.get("bank_account_name") as string) || "มูลนิธิ หรีดร่วมบุญ ESG Zero Waste";

    const hostBankName          = (form.get("host_bank_name") as string) || null;
    const hostBankAccountNumber = (form.get("host_bank_account_number") as string) || null;
    const hostBankAccountName   = (form.get("host_bank_account_name") as string) || null;

    if (!name || !birthDate || !deathDate || !ceremonyDate || !bankAccountNumber) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลที่จำเป็น: ชื่อ วันเกิด วันเสียชีวิต วันฌาปนกิจ เลขบัญชี" }, { status: 400 });
    }

    const photoFile = form.get("photo") as File | null;
    const qrFile    = form.get("qr_image") as File | null;

    const photoUrl = photoFile ? await uploadFile(supabase, photoFile, "photos")  : null;
    const qrUrl    = qrFile    ? await uploadFile(supabase, qrFile,    "qrcodes") : null;

    const ceYear   = parseInt(deathDate.split("-")[0]) || new Date().getFullYear();
    const hostCode = generateHostCode();
    let eventCode  = generateEventCode(ceYear);

    // Try with all columns first (migration applied), fall back to base columns only
    const fullPayload = {
      slug: eventCode.toLowerCase(),
      event_code: eventCode,
      center_id: centerId || null,
      name,
      birth_date: birthDate,
      death_date: deathDate,
      age,
      photo_url: photoUrl,
      ceremony_date: ceremonyDate,
      ceremony_time: ceremonyTime,
      ceremony_location: ceremonyLocation,
      ceremony_hall: ceremonyHall,
      prayer_date: prayerText,
      prayer_location: prayerSchedule,
      host_name: hostName,
      host_phone: hostPhone,
      host_code: hostCode,
      host_relationship: hostRelationship,
      funeral_status: "active" as const,
      bank_name: bankName,
      bank_account_number: bankAccountNumber,
      bank_account_name: bankAccountName,
      bank_account_image_url: qrUrl,
      host_bank_name: hostBankName,
      host_bank_account_number: hostBankAccountNumber,
      host_bank_account_name: hostBankAccountName,
      is_active: true,
    };

    let { data: memorial, error } = await supabase
      .from("memorials")
      .insert(fullPayload)
      .select()
      .single();

    // If extra columns don't exist yet, fall back to base-only insert
    if (error && error.message.includes("Could not find")) {
      const slug = `${eventCode.toLowerCase()}-${rand(3)}`;
      const basePayload = {
        slug,
        name,
        birth_date: birthDate,
        death_date: deathDate,
        age,
        photo_url: photoUrl,
        ceremony_date: ceremonyDate,
        ceremony_time: ceremonyTime,
        ceremony_location: ceremonyLocation,
        ceremony_hall: ceremonyHall,
        bank_name: bankName,
        bank_account_number: bankAccountNumber,
        bank_account_name: bankAccountName,
        bank_account_image_url: qrUrl,
        is_active: true,
      };
      ({ data: memorial, error } = await supabase
        .from("memorials")
        .insert(basePayload)
        .select()
        .single());
      // Use slug as event_code fallback and generate host_code client-side
      eventCode = slug.toUpperCase();
    }

    if (error) throw new Error(error.message);
    return NextResponse.json({ memorial, eventCode, hostCode, slug: memorial?.slug });
  } catch (e) {
    console.error("create memorial error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
