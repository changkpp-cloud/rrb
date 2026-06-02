import { redirect } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import { getAdminSession } from "@/lib/admin-session";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    redirect("/dashboard/admin");
  }
  return (
    <div className="min-h-screen" style={{ background: "#ffffff" }}>
      <AdminNav />
      <main className="max-w-4xl mx-auto px-4 py-5">{children}</main>
    </div>
  );
}
