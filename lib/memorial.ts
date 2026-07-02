import { createAdminClient } from "@/lib/supabase/admin";
import type { Center, Donation, Memorial } from "@/lib/supabase/types";

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

export async function getActiveMemorials(): Promise<Memorial[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("memorials")
      .select("*")
      .eq("is_active", true)
      .eq("funeral_status", "active")
      .not("center_id", "is", null)
      .order("ceremony_date", { ascending: true })
      .order("created_at", { ascending: false });
    return (data as Memorial[] | null) ?? [];
  } catch {
    return [];
  }
}

export async function getMemorialById(id: string): Promise<Memorial | null> {
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

export async function getMemorialBySlug(slug: string): Promise<Memorial | null> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("memorials")
      .select("*")
      .eq("slug", slug)
      .single();
    return (data as Memorial | null);
  } catch {
    return null;
  }
}

export type MemorialBoardDonation = Pick<Donation, "id" | "donor_name" | "donor_title" | "message">;

export async function getMemorialBoardDonations(memorialId: string): Promise<MemorialBoardDonation[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("donations")
      .select("id, donor_name, donor_title, message")
      .eq("memorial_id", memorialId)
      .eq("status", "confirmed")
      .order("confirmed_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(12);
    return (data as MemorialBoardDonation[] | null) ?? [];
  } catch {
    return [];
  }
}

// บอร์ดรำลึกหน้าแรก — ผู้มอบจริงจากทุกงาน (ล่าสุดก่อน) เอาไว้โชว์บนหน้าแรก
export async function getRecentBoardDonations(limit = 8): Promise<MemorialBoardDonation[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("donations")
      .select("id, donor_name, donor_title, message")
      .eq("status", "confirmed")
      .order("confirmed_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data as MemorialBoardDonation[] | null) ?? [];
  } catch {
    return [];
  }
}

export function normalizeHostCode(hostCode: string) {
  return hostCode.trim().toUpperCase();
}

export async function getMemorialByHostCode(hostCode: string): Promise<Memorial | null> {
  try {
    const normalizedHostCode = normalizeHostCode(hostCode);
    if (!normalizedHostCode) return null;

    const supabase = createAdminClient();
    const { data } = await supabase
      .from("memorials")
      .select("*")
      .eq("host_code", normalizedHostCode)
      .single();
    return (data as Memorial | null);
  } catch {
    return null;
  }
}

export async function getCenterById(centerId: string): Promise<Center | null> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("centers")
      .select("*")
      .eq("id", centerId)
      .single();
    return data as Center | null;
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
