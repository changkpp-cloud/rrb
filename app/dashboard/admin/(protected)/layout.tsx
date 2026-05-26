import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminNav from "@/components/AdminNav";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session || session.value !== "ok") {
    redirect("/dashboard/admin");
  }
  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(ellipse 110% 40% at 50% -5%,rgba(245,222,170,0.32) 0%,transparent 100%),linear-gradient(180deg,#FFF8F1 0%,#F7F3EA 35%,#F1E6DC 65%,#F7F3EA 85%,#FFF8F1 100%)" }}>
      <AdminNav />
      <main className="max-w-4xl mx-auto px-4 py-5">
        {children}
      </main>
    </div>
  );
}
