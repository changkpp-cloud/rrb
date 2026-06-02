import { revalidatePath } from "next/cache";
import { CheckCircle2, Clock3, ShieldCheck, UserRound, XCircle } from "lucide-react";
import { hashPassword, roleLabel, type AppRole } from "@/lib/iam";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Center = { id: string; name: string };
type RequestRow = {
  id: string;
  center_id: string;
  email: string;
  display_name: string;
  phone: string | null;
  requested_role: AppRole;
  auth_provider: string;
  password_hash: string | null;
  status: string;
  created_at: string;
};
type UserRow = {
  id: string;
  email: string | null;
  display_name: string;
  phone: string | null;
  status: string;
  auth_provider: string;
  created_at: string;
};
type MembershipRow = {
  id: string;
  center_id: string;
  user_id: string;
  role: AppRole;
  status: string;
};

async function getData() {
  const supabase = createAdminClient();
  const [
    { data: centers, error: centersError },
    { data: requests, error: requestsError },
    { data: users, error: usersError },
    { data: memberships, error: membershipsError },
  ] = await Promise.all([
    supabase.from("centers").select("id, name").order("name", { ascending: true }),
    supabase.from("center_user_requests").select("*").order("created_at", { ascending: false }),
    supabase.from("app_users").select("*").order("created_at", { ascending: false }),
    supabase.from("center_memberships").select("*").order("created_at", { ascending: false }),
  ]);

  const iamMissing = Boolean(requestsError || usersError || membershipsError);
  return {
    iamMissing,
    migrationError: requestsError?.message || usersError?.message || membershipsError?.message || "",
    centers: (centersError ? [] : centers ?? []) as Center[],
    requests: (requests ?? []) as RequestRow[],
    users: (users ?? []) as UserRow[],
    memberships: (memberships ?? []) as MembershipRow[],
  };
}

async function approveRequest(formData: FormData) {
  "use server";

  const requestId = String(formData.get("request_id") ?? "");
  const role = String(formData.get("role") ?? "center_staff") as AppRole;
  const supabase = createAdminClient();

  const { data: request } = await supabase
    .from("center_user_requests")
    .select("*")
    .eq("id", requestId)
    .eq("status", "pending")
    .maybeSingle();

  if (!request) return;

  const { data: existingUser } = await supabase
    .from("app_users")
    .select("*")
    .eq("email", request.email)
    .maybeSingle();

  let userId = existingUser?.id;
  if (!userId) {
    const { data: newUser } = await supabase
      .from("app_users")
      .insert({
        email: request.email,
        display_name: request.display_name,
        phone: request.phone,
        auth_provider: request.auth_provider,
        provider_user_id: request.provider_user_id,
        password_hash: request.password_hash,
        status: "active",
        approved_at: new Date().toISOString(),
      })
      .select("*")
      .single();
    userId = newUser?.id;
  } else {
    await supabase.from("app_users").update({ status: "active" }).eq("id", userId);
  }

  if (userId) {
    await supabase.from("center_memberships").upsert({
      center_id: request.center_id,
      user_id: userId,
      role,
      status: "active",
      approved_at: new Date().toISOString(),
    }, { onConflict: "center_id,user_id" });

    await supabase
      .from("center_user_requests")
      .update({ status: "active", approved_user_id: userId, reviewed_at: new Date().toISOString() })
      .eq("id", requestId);
  }

  revalidatePath("/dashboard/admin/users");
}

async function rejectRequest(formData: FormData) {
  "use server";
  const requestId = String(formData.get("request_id") ?? "");
  const supabase = createAdminClient();
  await supabase.from("center_user_requests").update({ status: "rejected", reviewed_at: new Date().toISOString() }).eq("id", requestId);
  revalidatePath("/dashboard/admin/users");
}

async function createUser(formData: FormData) {
  "use server";

  const centerId = String(formData.get("center_id") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "center_staff") as AppRole;
  if (!centerId || !displayName || !email || password.length < 8) return;

  const supabase = createAdminClient();
  const { data: user } = await supabase
    .from("app_users")
    .upsert({
      email,
      display_name: displayName,
      phone: phone || null,
      password_hash: hashPassword(password),
      auth_provider: "password",
      status: "active",
      approved_at: new Date().toISOString(),
    }, { onConflict: "email" })
    .select("*")
    .single();

  if (user?.id) {
    await supabase.from("center_memberships").upsert({
      center_id: centerId,
      user_id: user.id,
      role,
      status: "active",
      approved_at: new Date().toISOString(),
    }, { onConflict: "center_id,user_id" });
  }

  revalidatePath("/dashboard/admin/users");
}

export default async function AdminUsersPage() {
  const { centers, iamMissing, memberships, migrationError, requests, users } = await getData();
  const centerName = new Map(centers.map(c => [c.id, c.name]));
  const userName = new Map(users.map(u => [u.id, u.display_name]));
  const pendingRequests = requests.filter(r => r.status === "pending");

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-gold-800">ผู้ใช้และสิทธิ์ในระบบ</h2>
        <p className="text-[11px] text-gold-500">IAM / RBAC: แยกบัญชีรายคน กำหนดสิทธิ์ต่อศูนย์ และอนุมัติคำขอสมัคร</p>
      </div>

      {iamMissing && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-bold text-amber-800">ยังไม่ได้ติดตั้งตาราง IAM ใน Supabase</p>
          <p className="mt-1 text-[11px] text-amber-700">ให้รันไฟล์ <code>supabase/migration_iam_users.sql</code> ใน Supabase SQL editor ก่อนใช้งานจริง</p>
          {migrationError && <p className="mt-1 text-[10px] text-amber-600">{migrationError}</p>}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <Stat icon={Clock3} label="รออนุมัติ" value={pendingRequests.length} />
        <Stat icon={UserRound} label="ผู้ใช้ทั้งหมด" value={users.length} />
        <Stat icon={ShieldCheck} label="สิทธิ์ศูนย์" value={memberships.length} />
      </div>

      <section className="rounded-2xl bg-cream-50 gold-border card-shadow px-4 py-4 space-y-3">
        <div>
          <p className="text-sm font-bold text-gold-800">เพิ่มผู้ใช้ศูนย์โดยแอดมินกลาง</p>
          <p className="text-[11px] text-gold-500">ใช้กรณีสร้างบัญชีให้เจ้าหน้าที่โดยตรง ไม่ต้องรอสมัครเอง</p>
        </div>
        <form action={createUser} className="grid grid-cols-1 gap-2">
          <select name="center_id" className="rounded-xl gold-border bg-white px-3 py-2 text-xs text-gold-800" required>
            <option value="">เลือกศูนย์</option>
            {centers.map(center => <option key={center.id} value={center.id}>{center.name}</option>)}
          </select>
          <input name="display_name" placeholder="ชื่อผู้ใช้" className="rounded-xl gold-border bg-white px-3 py-2 text-xs" required />
          <input name="email" type="email" placeholder="อีเมล" className="rounded-xl gold-border bg-white px-3 py-2 text-xs" required />
          <input name="phone" placeholder="เบอร์โทร" className="rounded-xl gold-border bg-white px-3 py-2 text-xs" />
          <input name="password" type="password" placeholder="รหัสผ่านอย่างน้อย 8 ตัว" className="rounded-xl gold-border bg-white px-3 py-2 text-xs" required />
          <select name="role" className="rounded-xl gold-border bg-white px-3 py-2 text-xs text-gold-800" defaultValue="center_staff">
            <option value="center_manager">ผู้จัดการศูนย์</option>
            <option value="center_staff">เจ้าหน้าที่ศูนย์</option>
            <option value="center_viewer">ผู้ดูข้อมูล</option>
          </select>
          <button className="rounded-xl gold-gradient py-2.5 text-sm font-semibold text-white">สร้างผู้ใช้และให้สิทธิ์</button>
        </form>
      </section>

      <section className="space-y-2">
        <p className="text-xs font-semibold text-gold-700">คำขอสมัครรออนุมัติ</p>
        {pendingRequests.length === 0 ? (
          <Empty text="ไม่มีคำขอสมัครรออนุมัติ" />
        ) : pendingRequests.map(req => (
          <div key={req.id} className="rounded-2xl bg-cream-50 gold-border card-shadow px-4 py-3 space-y-3">
            <div>
              <p className="text-sm font-bold text-gold-800">{req.display_name}</p>
              <p className="text-[11px] text-gold-500">{req.email} · {req.phone || "ไม่มีเบอร์"}</p>
              <p className="text-[11px] text-gold-600">{centerName.get(req.center_id) ?? "ไม่พบศูนย์"} · ขอสิทธิ์ {roleLabel(req.requested_role)}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <form action={approveRequest} className="flex gap-2">
                <input type="hidden" name="request_id" value={req.id} />
                <select name="role" className="min-w-0 flex-1 rounded-xl gold-border bg-white px-2 py-2 text-[11px]" defaultValue={req.requested_role}>
                  <option value="center_manager">Manager</option>
                  <option value="center_staff">Staff</option>
                  <option value="center_viewer">Viewer</option>
                </select>
                <button className="rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-semibold text-white">อนุมัติ</button>
              </form>
              <form action={rejectRequest}>
                <input type="hidden" name="request_id" value={req.id} />
                <button className="flex w-full items-center justify-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-600">
                  <XCircle className="h-3.5 w-3.5" /> ปฏิเสธ
                </button>
              </form>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <p className="text-xs font-semibold text-gold-700">สมาชิกศูนย์ที่ใช้งานอยู่</p>
        {memberships.length === 0 ? <Empty text="ยังไม่มีสมาชิกศูนย์" /> : memberships.map(m => (
          <div key={m.id} className="flex items-center gap-3 rounded-xl bg-cream-50 gold-border px-4 py-3">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-gold-800">{userName.get(m.user_id) ?? m.user_id}</p>
              <p className="truncate text-[11px] text-gold-500">{centerName.get(m.center_id) ?? m.center_id}</p>
            </div>
            <span className="rounded-full bg-gold-100 px-2 py-1 text-[10px] font-semibold text-gold-700">{roleLabel(m.role)}</span>
          </div>
        ))}
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-cream-50 gold-border card-shadow px-3 py-3 text-center">
      <Icon className="mx-auto mb-1 h-4 w-4 text-gold-500" />
      <p className="text-xl font-bold text-gold-800">{value}</p>
      <p className="text-[10px] text-gold-500">{label}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl bg-cream-50 gold-border px-4 py-5 text-center">
      <p className="text-sm text-gold-400">{text}</p>
    </div>
  );
}
