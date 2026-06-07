import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session || session.value !== "ok") {
    redirect("/dashboard/admin");
  }
  return (
    <div className="min-h-screen" style={{ background: "#ffffff" }}>
      <main className="max-w-4xl mx-auto px-4 py-5">
        {children}
      </main>
    </div>
  );
}
