import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function generateHostCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "H";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function generateSlug(deathYear: string): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `m-${deathYear}-${rand}`.toLowerCase();
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const supabase = createAdminClient();

    const centerId = form.get("center_id") as string | null;
    const name = (form.get("name") as string)?.trim();
    const birthDate = form.get("birth_date") as string;
    const deathDate = form.get("death_date") as string;
    const age = parseInt(form.get("age") as string) || 0;
    const ceremonyDate = form.get("ceremony_date") as string;
    const ceremonyTime = (form.get("ceremony_time") as string) || "";
    const ceremonyLocation = (form.get("ceremony_location") as string) || "";
    const ceremonyHall = (form.get("ceremony_hall") as string) || null;
    const prayerDate = (form.get("prayer_date") as string) || null;
    const prayerLocation = (form.get("prayer_location") as string) || null;
    const hostName = (form.get("host_name") as string) || null;
    const hostPhone = (form.get("host_phone") as string) || null;
    const bankName = (form.get("bank_name") as string) || "ธนาคารกรุงไทย\nKrungthai Bank";
    const bankAccountNumber = (form.get("bank_account_number") as string) || "";
    const bankAccountName = (form.get("bank_account_name") as string) || "มูลนิธิ หรีดร่วมบุญ ESG Zero Waste";

    if (!name || !birthDate || !deathDate || !ceremonyDate || !bankAccountNumber) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
    }

    // Upload photo
    let photoUrl: string | null = null;
    const photoFile = form.get("photo") as File | null;
    if (photoFile && photoFile.size > 0) {
      const ext = photoFile.name.split(".").pop() || "jpg";
      const path = `memorials/${Date.now()}/photo.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("memorials").upload(path, photoFile, { contentType: photoFile.type });
      if (!uploadErr) {
        photoUrl = supabase.storage.from("memorials").getPublicUrl(path).data.publicUrl;
      }
    }

    // Upload QR image
    let qrUrl: string | null = null;
    const qrFile = form.get("qr_image") as File | null;
    if (qrFile && qrFile.size > 0) {
      const ext = qrFile.name.split(".").pop() || "jpg";
      const path = `memorials/${Date.now()}-qr/qr.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("memorials").upload(path, qrFile, { contentType: qrFile.type });
      if (!uploadErr) {
        qrUrl = supabase.storage.from("memorials").getPublicUrl(path).data.publicUrl;
      }
    }

    const deathYear = deathDate.split("-")[0] || String(new Date().getFullYear());
    const hostCode = generateHostCode();
    let slug = generateSlug(deathYear);

    // Ensure slug uniqueness
    const { data: existing } = await supabase.from("memorials").select("id").eq("slug", slug).maybeSingle();
    if (existing) slug = `${slug}-${Math.random().toString(36).slice(2, 5)}`;

    const { data: memorial, error } = await supabase
      .from("memorials")
      .insert({
        slug,
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
        prayer_date: prayerDate,
        prayer_location: prayerLocation,
        host_name: hostName,
        host_phone: hostPhone,
        host_code: hostCode,
        funeral_status: "active",
        bank_name: bankName,
        bank_account_number: bankAccountNumber,
        bank_account_name: bankAccountName,
        bank_account_image_url: qrUrl,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ memorial, slug, hostCode });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
