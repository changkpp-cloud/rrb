import { createClient } from "@/lib/supabase/server";
import PaymentPageClient from "@/components/PaymentPageClient";
import type { Memorial } from "@/lib/supabase/types";

const DEMO_MEMORIAL: Memorial = {
  id: "demo",
  slug: "demo",
  name: "นางสาว สุภาพร ปทุมานนท์",
  birth_date: "1988-06-19",
  death_date: "2016-03-16",
  age: 28,
  photo_url: null,
  ceremony_date: "2016-03-20",
  ceremony_time: "",
  ceremony_location: "วัดไตรภูมิ",
  ceremony_hall: "ต.พรานกระต่าย อ.พรานกระต่าย จ.กำแพงเพชร",
  bank_name: "มูลนิธิหรีดร่วมบุญ ESG Zero Waste\nธนาคารกสิกรไทย",
  bank_account_number: "6200358257",
  bank_account_name: "มูลนิธิหรีดร่วมบุญ ESG Zero Waste",
  bank_account_image_url: null,
  is_active: true,
  created_at: new Date().toISOString(),
};

async function getMemorial(): Promise<Memorial> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("memorials")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    return (data as Memorial | null) ?? DEMO_MEMORIAL;
  } catch {
    return DEMO_MEMORIAL;
  }
}

export default async function PaymentPage() {
  const memorial = await getMemorial();
  return <PaymentPageClient memorial={memorial} />;
}
