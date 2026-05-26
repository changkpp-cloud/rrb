import { createAdminClient } from "@/lib/supabase/admin";
import type { Memorial } from "@/lib/supabase/types";

export const DEMO_MEMORIAL: Memorial = {
  id: "demo",
  slug: "demo",
  center_id: null,
  name: "นางสาว สุภาพร ปทุมานนท์",
  birth_date: "1988-06-19",
  death_date: "2016-03-16",
  age: 28,
  photo_url: "/img/001.jpg",
  ceremony_date: "2016-03-20",
  ceremony_time: "",
  ceremony_location: "วัดไตรภูมิ",
  ceremony_hall: "ต.พรานกระต่าย อ.พรานกระต่าย จ.กำแพงเพชร",
  prayer_date: "2016-03-17",
  prayer_location: "วัดไตรภูมิ",
  host_name: "นายสมศักดิ์ ปทุมานนท์",
  host_phone: "0812345678",
  host_code: "DEMO001",
  funeral_status: "active",
  bank_name: "มูลนิธิหรีดร่วมบุญ ESG Zero Waste\nธนาคารกรุงไทย",
  bank_account_number: "6200358257",
  bank_account_name: "มูลนิธิหรีดร่วมบุญ ESG Zero Waste",
  bank_account_image_url: null,
  is_active: true,
  created_at: new Date().toISOString(),
};

export async function getMemorial(): Promise<Memorial | null> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("memorials")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    return (data as Memorial | null);
  } catch {
    return null;
  }
}

export async function getMemorials(): Promise<Memorial[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("memorials")
      .select("*")
      .order("created_at", { ascending: false });
    return (data as Memorial[] | null) ?? [];
  } catch {
    return [];
  }
}

export async function getMemorialById(id: string): Promise<Memorial | null> {
  if (id === "demo") return DEMO_MEMORIAL;
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("memorials")
      .select("*")
      .eq("id", id)
      .single();
    return (data as Memorial | null);
  } catch {
    return null;
  }
}

export async function getMemorialByHostCode(hostCode: string): Promise<Memorial | null> {
  if (hostCode === "DEMO001") return DEMO_MEMORIAL;
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("memorials")
      .select("*")
      .eq("host_code", hostCode)
      .single();
    return (data as Memorial | null);
  } catch {
    return null;
  }
}

export function formatThaiDate(isoDate: string): string {
  const months = [
    "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน",
    "พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม",
    "กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
  ];
  const d = new Date(isoDate);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}
