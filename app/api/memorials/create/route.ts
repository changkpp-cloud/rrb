import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { romanizeThaiFirstName } from "@/lib/thai-romanize";
import { serializePrayerDetails } from "@/lib/prayer-details";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function rand(n: number) {
  let s = "";
  for (let i = 0; i < n; i++) s += CHARS[Math.floor(Math.random() * CHARS.length)];
  return s;
}

function generateHostCode(): string {
  return `H${rand(5)}`;
}

async function buildMemorialSlug(
  supabase: ReturnType<typeof createAdminClient>,
  centerId: string | null,
  deceasedName: string,
): Promise<string> {
  // Resolve center prefix from official_lgo_code (8-digit อปท code)
  let prefix = "";
  if (centerId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: center } = await (supabase.from("centers") as any)
      .select("official_lgo_code, center_code")
      .eq("id", centerId)
      .single();
    if (center?.official_lgo_code) {
      prefix = String(center.official_lgo_code).replace(/\D/g, "").slice(0, 8);
    } else if (center?.center_code) {
      prefix = String(center.center_code)
        .replace(/^RRB-/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
    }
  }

  const namePart = romanizeThaiFirstName(deceasedName);
  const base = [prefix, namePart].filter(Boolean).join("-") ||
    `evt-${new Date().getFullYear()}-${rand(4).toLowerCase()}`;

  // Find a unique slug
  let slug = base;
  for (let counter = 2; counter <= 99; counter++) {
    const { data: existing } = await supabase
      .from("memorials")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${base}-${counter}`;
  }

  return slug;
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

    const bankName          = (form.get("bank_name") as string) || "";
    const bankAccountNumber = (form.get("bank_account_number") as string) || "";
    const bankAccountName   = (form.get("bank_account_name") as string) || "";
    const qrImageUrl        = (form.get("qr_image_url") as string) || null;

    const hostBankName          = (form.get("host_bank_name") as string) || null;
    const hostBankAccountNumber = (form.get("host_bank_account_number") as string) || null;
    const hostBankAccountName   = (form.get("host_bank_account_name") as string) || null;

    if (!name || !birthDate || !deathDate || !ceremonyDate) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลที่จำเป็น: ชื่อ วันเกิด วันเสียชีวิต วันฌาปนกิจ" }, { status: 400 });
    }

    const photoFile = form.get("photo") as File | null;
    const qrFile    = form.get("qr_image") as File | null;

    const photoUrl = photoFile ? await uploadFile(supabase, photoFile, "photos") : null;
    // QR: prefer pre-uploaded URL from center settings, fall back to file upload
    const qrUrl = qrImageUrl ?? (qrFile ? await uploadFile(supabase, qrFile, "qrcodes") : null);

    const hostCode = generateHostCode();
    const slug     = await buildMemorialSlug(supabase, centerId, name);
    const eventCode = slug.toUpperCase();

    // Try with all columns first (migration applied), fall back to base columns only
    const fullPayload = {
      slug,
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
      prayer_date: null,
      prayer_location: serializePrayerDetails(prayerText, prayerSchedule),
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
    }

    if (error) throw new Error(error.message);
    return NextResponse.json({ memorial, eventCode, hostCode, slug: memorial?.slug });
  } catch (e) {
    console.error("create memorial error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
