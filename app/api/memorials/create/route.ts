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

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const supabase = createAdminClient();

    const centerId    = form.get("center_id") as string | null;
    const name        = (form.get("name") as string)?.trim();
    const birthDate   = form.get("birth_date") as string;
    const deathDate   = form.get("death_date") as string;
    const age         = parseInt(form.get("age") as string) || 0;

    // ceremony
    const ceremonyDate     = form.get("ceremony_date") as string;
    const ceremonyTime     = (form.get("ceremony_time") as string) || "";
    const ceremonyLocation = (form.get("ceremony_location") as string) || "";
    const ceremonyHall     = (form.get("ceremony_hall") as string) || null;

    // prayer (stored as free text in prayer_location)
    const prayerSchedule = (form.get("prayer_schedule") as string) || null;

    // host Level A
    const hostName         = (form.get("host_name") as string) || null;
    const hostPhone        = (form.get("host_phone") as string) || null;
    const hostRelationship = (form.get("host_relationship") as string) || null;
    const consentConfirmed = form.get("consent_confirmed") === "true";

    // bank Level B (central account)
    const bankName          = (form.get("bank_name") as string) || "ธนาคารกรุงไทย\nKrungthai Bank";
    const bankAccountNumber = (form.get("bank_account_number") as string) || "";
    const bankAccountName   = (form.get("bank_account_name") as string) || "มูลนิธิ หรีดร่วมบุญ ESG Zero Waste";

    // host payout account Level C
    const hostBankName          = (form.get("host_bank_name") as string) || null;
    const hostBankAccountNumber = (form.get("host_bank_account_number") as string) || null;
    const hostBankAccountName   = (form.get("host_bank_account_name") as string) || null;

    if (!name || !birthDate || !deathDate || !ceremonyDate || !bankAccountNumber) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลที่จำเป็น: ชื่อ วันเกิด วันเสียชีวิต วันฌาปนกิจ" }, { status: 400 });
    }
    if (!consentConfirmed) {
      return NextResponse.json({ error: "กรุณายืนยันว่าได้รับอนุญาตจากเจ้าภาพก่อนเปิดหน้างาน" }, { status: 400 });
    }

    // Upload files
    const photoFile       = form.get("photo") as File | null;
    const qrFile          = form.get("qr_image") as File | null;
    const certFile        = form.get("death_certificate") as File | null;
    const idCardFile      = form.get("host_id_card") as File | null;

    const photoUrl   = photoFile   ? await uploadFile(supabase, photoFile,  "photos")   : null;
    const qrUrl      = qrFile      ? await uploadFile(supabase, qrFile,     "qrcodes")  : null;
    const certUrl    = certFile    ? await uploadFile(supabase, certFile,   "documents") : null;
    const idCardUrl  = idCardFile  ? await uploadFile(supabase, idCardFile, "documents") : null;

    // Generate codes
    const ceYear   = parseInt(deathDate.split("-")[0]) || new Date().getFullYear();
    const hostCode = generateHostCode();
    let eventCode  = generateEventCode(ceYear);

    // Ensure uniqueness
    const { data: existing } = await supabase
      .from("memorials")
      .select("id")
      .eq("event_code", eventCode)
      .maybeSingle();
    if (existing) eventCode = generateEventCode(ceYear);

    const slug = eventCode.toLowerCase();

    const { data: memorial, error } = await supabase
      .from("memorials")
      .insert({
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
        prayer_location: prayerSchedule,
        host_name: hostName,
        host_phone: hostPhone,
        host_code: hostCode,
        host_relationship: hostRelationship,
        consent_confirmed: consentConfirmed,
        funeral_status: "active",
        bank_name: bankName,
        bank_account_number: bankAccountNumber,
        bank_account_name: bankAccountName,
        bank_account_image_url: qrUrl,
        host_bank_name: hostBankName,
        host_bank_account_number: hostBankAccountNumber,
        host_bank_account_name: hostBankAccountName,
        death_certificate_url: certUrl,
        host_id_card_url: idCardUrl,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ memorial, eventCode, hostCode, slug });
  } catch (e) {
    console.error("create memorial error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
