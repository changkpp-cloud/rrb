import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

export type AppRole = "super_admin" | "center_manager" | "center_staff" | "center_viewer";
export type AppUser = Database["public"]["Tables"]["app_users"]["Row"];
export type CenterMembership = Database["public"]["Tables"]["center_memberships"]["Row"];

const SESSION_COOKIE = "center_user_session";
const SESSION_HOURS = 8;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string | null) {
  if (!storedHash) return false;
  const [scheme, salt, hash] = storedHash.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function roleLabel(role: AppRole | string | null) {
  switch (role) {
    case "super_admin": return "แอดมินกลาง";
    case "center_manager": return "ผู้จัดการศูนย์";
    case "center_staff": return "เจ้าหน้าที่ศูนย์";
    case "center_viewer": return "ผู้ดูข้อมูล";
    default: return "ไม่ระบุ";
  }
}

export function canManageCenterUsers(role: AppRole | string | null) {
  return role === "super_admin" || role === "center_manager";
}

export function canEditCenterWork(role: AppRole | string | null) {
  return role === "super_admin" || role === "center_manager" || role === "center_staff";
}

export async function setCenterUserSession(userId: string) {
  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  const supabase = createAdminClient();
  await supabase.from("app_user_sessions").insert({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
  });
}

export async function getCenterUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const supabase = createAdminClient();
  const { data: session } = await supabase
    .from("app_user_sessions")
    .select("id, user_id, expires_at")
    .eq("token_hash", hashSessionToken(token))
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!session) return null;

  const { data: user } = await supabase
    .from("app_users")
    .select("*")
    .eq("id", session.user_id)
    .eq("status", "active")
    .maybeSingle();

  return user ? { user: user as AppUser, sessionId: session.id } : null;
}

export async function invalidateUserSessions(userId: string) {
  const supabase = createAdminClient();
  await supabase.from("app_user_sessions").delete().eq("user_id", userId);
}

export async function getCenterAccess(centerId: string) {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("admin_session")?.value;
  if (adminSession === "ok") {
    return { allowed: true, role: "super_admin" as AppRole, user: null, legacy: false };
  }

  const legacyCenterId = cookieStore.get("center_session")?.value;
  if (legacyCenterId === centerId) {
    return { allowed: true, role: "center_manager" as AppRole, user: null, legacy: true };
  }

  const session = await getCenterUserSession();
  if (!session) return { allowed: false, role: null, user: null, legacy: false };

  const supabase = createAdminClient();
  const { data: membership } = await supabase
    .from("center_memberships")
    .select("*")
    .eq("center_id", centerId)
    .eq("user_id", session.user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!membership) return { allowed: false, role: null, user: session.user, legacy: false };
  return {
    allowed: true,
    role: (membership as CenterMembership).role,
    user: session.user,
    legacy: false,
  };
}
