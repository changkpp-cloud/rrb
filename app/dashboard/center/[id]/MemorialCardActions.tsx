"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, XCircle as CloseIcon, AlertTriangle, Loader2, XCircle } from "lucide-react";

interface Props {
  memorialId: string;
  memorialName: string;
  isClosed: boolean;
}

type Dialog = "close" | "delete" | null;

export default function MemorialCardActions({ memorialId, memorialName, isClosed }: Props) {
  const router = useRouter();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function open(d: Dialog) {
    setDialog(d);
    setError("");
  }

  async function handleClose() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/memorials/${memorialId}/close`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "เกิดข้อผิดพลาด");
      setDialog(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    }
    setLoading(false);
  }

  async function handleDelete() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/memorials/${memorialId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "เกิดข้อผิดพลาด");
      setDialog(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    }
    setLoading(false);
  }

  return (
    <>
      {/* Action buttons */}
      <div className="flex flex-col gap-1.5 shrink-0">
        {!isClosed && (
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); open("close"); }}
            className="w-8 h-8 rounded-xl border border-amber-200 bg-amber-50 flex items-center justify-center text-amber-500 hover:bg-amber-100 hover:text-amber-700 transition-all"
            title="ปิดงานศพ"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); open("delete"); }}
          className="w-8 h-8 rounded-xl border border-red-200 bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 hover:text-red-600 transition-all"
          title="ลบงานศพ"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Modal */}
      {dialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => !loading && setDialog(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            {dialog === "close" && (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-700">ปิดงานศพ</p>
                    <p className="text-[11px] text-gold-500">ปิดแล้วจะไม่รับสลิปใหม่ได้</p>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                  <p className="text-xs text-amber-800 leading-relaxed">
                    ยืนยันปิดงาน <strong>"{memorialName}"</strong>?<br />
                    สถานะจะเปลี่ยนเป็น "ปิดแล้ว" ถาวร
                  </p>
                </div>
                {error && <ErrorBox msg={error} />}
                <div className="flex gap-2">
                  <CancelBtn onClick={() => setDialog(null)} disabled={loading} />
                  <button
                    onClick={handleClose}
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloseIcon className="w-4 h-4" />}
                    {loading ? "กำลังปิด..." : "ยืนยันปิดงาน"}
                  </button>
                </div>
              </>
            )}

            {dialog === "delete" && (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-700">ลบงานศพ</p>
                    <p className="text-[11px] text-gold-500">การลบไม่สามารถยกเลิกได้</p>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                  <p className="text-xs text-red-700 leading-relaxed">
                    คุณต้องการลบงาน <strong>"{memorialName}"</strong>?<br />
                    ข้อมูลผู้ร่วมบุญทั้งหมดจะหายไปด้วย
                  </p>
                </div>
                {error && <ErrorBox msg={error} />}
                <div className="flex gap-2">
                  <CancelBtn onClick={() => setDialog(null)} disabled={loading} />
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    {loading ? "กำลังลบ..." : "ยืนยันลบ"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
      <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
      <p className="text-xs text-red-600">{msg}</p>
    </div>
  );
}

function CancelBtn({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex-1 py-2.5 rounded-xl border border-gold-300 text-gold-600 text-sm font-semibold hover:bg-cream-100 transition-colors disabled:opacity-50"
    >
      ยกเลิก
    </button>
  );
}
