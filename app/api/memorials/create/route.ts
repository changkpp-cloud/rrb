import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCenterAccess, canEditCenterWork } from "@/lib/iam";
import { romanizeThaiFirstName } from "@/lib/thai-romanize";
import { centerSlugPrefix, sanitizeSlugPart } from "@/lib/center-slug";
import { serializePrayerDetails } from "@/lib/prayer-details";
import { normalizePhone, OTP_VERIFY_WINDOW_MS } from "@/lib/otp";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function rand(n: number) {
  let s = "";
  for (let i = 0; i < n; i++) s += CHARS[Math.floor(Math.random() * CHARS.length)];
  return s;
}

function generateHostCode(): string {
  return `H${rand(5)}`;
}

/** prefix ของ slug = รหัสประจำศูนย์ (อปท.) */
async function resolveCenterPrefix(
  supabase: ReturnType<typeof createAdminClient>,
  centerId: string | null,
): Promise<string> {
  if (!centerId) return "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: center } = await (supabase.from("centers") as any)
    .select("official_lgo_code, center_code")
    .eq("id", centerId)
    .single();
  return centerSlugPrefix(center);
}

async function slugExists(
  supabase: ReturnType<typeof createAdminClient>,
  slug: string,
): Promise<boolean> {
  const { data } = await supabase.from("memorials").select("id").eq("slug", slug).maybeSingle();
  return Boolean(data);
}

/** auto: prefix-ชื่อจริง แล้วเติมเลขถ้าซ้ำ */
async function buildMemorialSlug(
  supabase: ReturnType<typeof createAdminClient>,
  centerId: string | null,
  deceasedName: string,
): Promise<string> {
  const prefix = await resolveCenterPrefix(supabase, centerId);
  const namePart = romanizeThaiFirstName(deceasedName);
  const base = [prefix, namePart].filter(Boolean).join("-") ||
    `evt-${new Date().getFullYear()}-${rand(4).toLowerCase()}`;

  let slug = base;
  for (let counter = 2; counter <= 99; counter++) {
    if (!(await slugExists(supabase, slug))) break;
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

    // ตรวจสิทธิ์: ต้องเป็นศูนย์ที่ล็อกอินและมีสิทธิ์แก้งานของศูนย์นี้ (กันยิง API ตรงจากคนนอก)
    if (!centerId) {
      return NextResponse.json({ error: "ไม่พบศูนย์ที่เปิดงาน" }, { status: 400 });
    }
    const access = await getCenterAccess(centerId);
    if (!access.allowed || !canEditCenterWork(access.role)) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เปิดงานในศูนย์นี้" }, { status: 403 });
    }

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

    // ที่ตั้งงาน — รหัสมาตรฐานกรมการปกครอง (ผูก อปท. ได้) + ชื่อสำหรับแสดงผล
    const toNum = (v: FormDataEntryValue | null) => { const n = parseInt(v as string); return Number.isFinite(n) ? n : null; };
    const ceremonyProvinceCode    = toNum(form.get("ceremony_province_code"));
    const ceremonyProvinceName    = (form.get("ceremony_province_name") as string) || null;
    const ceremonyDistrictCode    = toNum(form.get("ceremony_district_code"));
    const ceremonyDistrictName    = (form.get("ceremony_district_name") as string) || null;
    const ceremonySubdistrictCode = toNum(form.get("ceremony_subdistrict_code"));
    const ceremonySubdistrictName = (form.get("ceremony_subdistrict_name") as string) || null;
    const ceremonyPostalCode      = toNum(form.get("ceremony_postal_code"));

    const hostName         = (form.get("host_name") as string) || null;
    const hostPhoneRaw     = (form.get("host_phone") as string) || null;
    const hostPhone        = hostPhoneRaw ? normalizePhone(hostPhoneRaw) : null;
    const hostRelationship = (form.get("host_relationship") as string) || null;

    // ยืนยันเบอร์เจ้าภาพด้วย OTP ก่อนเปิดงาน (เงินเข้าบัญชีเจ้าภาพโดยตรง → ต้องเป็นเบอร์ตัวจริงที่อยู่หน้าเคาน์เตอร์)
    // เช็กว่ามีคำขอ OTP ของ (ศูนย์ + เบอร์) ที่ยืนยันแล้วภายในกรอบเวลา
    let hostPhoneVerified = false;
    if (hostPhone) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: otpRow } = await (supabase as any).from("host_otp_requests")
        .select("verified_at")
        .eq("center_id", centerId)
        .eq("phone", hostPhone)
        .not("verified_at", "is", null)
        .order("verified_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      hostPhoneVerified = Boolean(
        otpRow?.verified_at &&
        Date.now() - new Date(otpRow.verified_at).getTime() < OTP_VERIFY_WINDOW_MS,
      );
    }

    const bankName          = (form.get("bank_name") as string) || "";
    const bankAccountNumber = (form.get("bank_account_number") as string) || "";
    const bankAccountName   = (form.get("bank_account_name") as string) || "";
    const qrImageUrl        = (form.get("qr_image_url") as string) || null;

    const hostBankName          = (form.get("host_bank_name") as string) || null;
    const hostBankAccountNumber = (form.get("host_bank_account_number") as string) || null;
    const hostBankAccountName   = (form.get("host_bank_account_name") as string) || null;
    const printerId             = (form.get("printer_id") as string) || null;

    if (!name || !birthDate || !deathDate || !ceremonyDate) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลที่จำเป็น: ชื่อ วันเกิด วันเสียชีวิต วันฌาปนกิจ" }, { status: 400 });
    }

    const photoFile = form.get("photo") as File | null;
    const qrFile    = form.get("qr_image") as File | null;

    const photoUrl = photoFile ? await uploadFile(supabase, photoFile, "photos") : null;
    // QR: prefer pre-uploaded URL from center settings, fall back to file upload
    const qrUrl = qrImageUrl ?? (qrFile ? await uploadFile(supabase, qrFile, "qrcodes") : null);

    const hostCode = generateHostCode();

    // slug: ถ้าผู้เปิดงานแก้/กรอกเอง ใช้ prefix ศูนย์ + ส่วนที่กรอก แล้วกันซ้ำ (แจ้งให้แก้)
    // ถ้าไม่กรอก → ระบบสร้างอัตโนมัติจากชื่อจริง
    const slugPartRaw = ((form.get("slug_part") as string) || "").trim();
    let slug: string;
    if (slugPartRaw) {
      const prefix = await resolveCenterPrefix(supabase, centerId);
      const part = sanitizeSlugPart(slugPartRaw);
      if (!part) {
        return NextResponse.json({ error: "URL ไม่ถูกต้อง กรุณาใช้ตัวอักษรอังกฤษหรือตัวเลข" }, { status: 400 });
      }
      slug = [prefix, part].filter(Boolean).join("-");
      if (await slugExists(supabase, slug)) {
        return NextResponse.json(
          { error: `URL "${slug}" ถูกใช้แล้วในระบบ กรุณาเพิ่มเลขหรือตัวอักษรให้ไม่ซ้ำ`, code: "slug_taken" },
          { status: 409 },
        );
      }
    } else {
      slug = await buildMemorialSlug(supabase, centerId, name);
    }
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
      ceremony_province_code: ceremonyProvinceCode,
      ceremony_province_name: ceremonyProvinceName,
      ceremony_district_code: ceremonyDistrictCode,
      ceremony_district_name: ceremonyDistrictName,
      ceremony_subdistrict_code: ceremonySubdistrictCode,
      ceremony_subdistrict_name: ceremonySubdistrictName,
      ceremony_postal_code: ceremonyPostalCode,
      prayer_date: null,
      prayer_location: serializePrayerDetails(prayerText, prayerSchedule),
      host_name: hostName,
      host_phone: hostPhone,
      host_phone_verified: hostPhoneVerified,
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
      printer_id: printerId,
      is_active: true,
    };

    // Insert resiliently: if a column doesn't exist in the DB yet (e.g. printer_id
    // before its migration), drop only that column and retry — never silently lose
    // critical fields like host_code / host_name (which broke host login before).
    const payload: Record<string, unknown> = { ...fullPayload };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let memorial: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let error: any = null;
    for (let attempt = 0; attempt < 10; attempt++) {
      // ceremony_* / printer_id อาจยังไม่อยู่ใน generated types — ใช้ as any ตามแพทเทิร์น repo
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ({ data: memorial, error } = await (supabase.from("memorials") as any)
        .insert(payload)
        .select()
        .single());
      if (!error) break;
      const missing = error.message.match(/Could not find the '(\w+)' column/);
      if (missing && missing[1] in payload) {
        delete payload[missing[1]];
        continue;
      }
      break;
    }

    if (error) throw new Error(error.message);
    return NextResponse.json({ memorial, eventCode, hostCode, slug: memorial?.slug });
  } catch (e) {
    console.error("create memorial error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
