"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Copy, Loader2, Share2, XCircle } from "lucide-react";
import IosPageHeader from "@/components/IosPageHeader";
import AiPhotoResult from "@/components/ai-photo/AiPhotoResult";

type JobState = {
  jobId: string;
  jobUrl: string;
  status: "pending" | "processing" | "completed" | "failed";
  imageUrl: string | null;
  error: string | null;
};

export default function AiPhotoJobPageClient({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<JobState | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function load() {
      const res = await fetch(`/api/ai-photo/jobs/${jobId}`, { cache: "no-store" });
      const data = await res.json();
      if (cancelled) return;

      if (res.ok) {
        setJob(data as JobState);
        if (data.status === "pending" || data.status === "processing") {
          timer = setTimeout(load, 7000);
        }
      } else {
        setJob({
          jobId,
          jobUrl: window.location.href,
          status: "failed",
          imageUrl: null,
          error: data.error ?? "โหลดสถานะไม่สำเร็จ",
        });
      }
    }

    load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [jobId]);

  async function copyLink() {
    await navigator.clipboard.writeText(job?.jobUrl || window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function shareLink() {
    const url = job?.jobUrl || window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: "ภาพมอบหรีดร่วมบุญ",
        text: "เปิดดูสถานะภาพมอบหรีดที่กำลังสร้าง",
        url,
      });
      return;
    }
    await copyLink();
  }

  const status = job?.status ?? "pending";
  const isDone = status === "completed" && job?.imageUrl;
  const isFailed = status === "failed";

  return (
    <div className="min-h-dvh flex flex-col bg-white">
      <IosPageHeader title="หรีดร่วมบุญ" subtitle="AI Photo" backHref="/" />
      <main className="flex-1">
        <div className="mx-auto max-w-lg px-4 py-5 space-y-4">
          <div className="rounded-2xl bg-cream-50 gold-border card-shadow p-4 space-y-3">
            <div className="flex items-center gap-2">
              {isDone ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : isFailed ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-gold-500" />
              )}
              <div>
                <p className="text-sm font-bold text-gold-800">
                  {isDone
                    ? "ภาพมอบหรีดพร้อมแล้ว"
                    : isFailed
                    ? "สร้างภาพไม่สำเร็จ"
                    : "กำลังสร้างภาพมอบหรีด"}
                </p>
                <p className="text-[11px] text-gold-500">
                  {isDone
                    ? "กดบันทึกภาพหรือแชร์ LINE ได้ด้านล่าง"
                    : isFailed
                    ? job?.error ?? "กรุณาลองสร้างใหม่อีกครั้ง"
                    : "หน้านี้จะอัปเดตสถานะอัตโนมัติ สามารถบันทึกลิงก์ไว้กลับมาดูภายหลังได้"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={copyLink}
                className="flex items-center justify-center gap-2 rounded-xl border border-gold-200 bg-white px-3 py-2.5 text-xs font-bold text-gold-700"
              >
                <Copy className="h-4 w-4" />
                {copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
              </button>
              <button
                type="button"
                onClick={shareLink}
                className="flex items-center justify-center gap-2 rounded-xl gold-gradient px-3 py-2.5 text-xs font-bold text-white"
              >
                <Share2 className="h-4 w-4" />
                แชร์ลิงก์
              </button>
            </div>
          </div>

          {isDone && (
            <AiPhotoResult
              images={[job.imageUrl as string]}
              selectedIdx={selectedIdx}
              onSelect={setSelectedIdx}
            />
          )}
        </div>
      </main>
    </div>
  );
}
