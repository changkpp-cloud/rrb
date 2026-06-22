"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function CenterLogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/center/logout", { method: "POST" });
    router.push("/dashboard/center");
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 active:scale-[0.98] transition-all disabled:opacity-50"
    >
      <LogOut className="w-4 h-4" />
      {loading ? "กำลังออก..." : "ออกจากระบบ"}
    </button>
  );
}
