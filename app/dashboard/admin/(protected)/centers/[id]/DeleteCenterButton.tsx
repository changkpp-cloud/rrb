"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function DeleteCenterButton({
  centerId,
  centerName,
}: {
  centerId: string;
  centerName: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleDelete() {
    if (confirm !== centerName) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/centers/${centerId}/purge`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "เกิดข้อผิดพลาด");
      router.push("/dashboard/admin/centers");
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setConfirm(""); setError(""); }}
        className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
        ลบศูนย์นี้
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-bold text-red-700">ลบศูนย์และข้อมูลทั้งหมด</p>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                การลบจะ <span className="font-semibold text-red-600">ลบถาวร</span> ทั้งหมดนี้:
              </p>
              <ul className="text-[11px] text-gray-500 list-disc list-inside space-y-0.5">
                <li>งานศพทั้งหมดในศูนย์นี้</li>
                <li>รายการร่วมบุญและสลิปทั้งหมด</li>
                <li>ป้ายชื่อและ print jobs ทั้งหมด</li>
                <li>ข้อมูลศูนย์ทั้งหมด</li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] text-gray-600">
                พิมพ์ชื่อศูนย์ <span className="font-semibold text-red-700">&ldquo;{centerName}&rdquo;</span> เพื่อยืนยัน
              </p>
              <input
                type="text"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={centerName}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-300"
              />
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDelete}
                disabled={loading || confirm !== centerName}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                {loading ? "กำลังลบ..." : "ลบถาวร"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
