import { createAdminClient } from "@/lib/supabase/admin";
import type { Memorial } from "@/lib/supabase/types";

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

export async function getMemorialByHostCode(hostCode: string): Promise<Memorial | null> {
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
