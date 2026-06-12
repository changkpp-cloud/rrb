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
    const url = job?.jobUrl || window.location.href;
    const text = isDone
      ? `ภาพมอบหรีดพร้อมแล้ว เปิดลิงก์นี้เพื่อบันทึกหรือแชร์ภาพ: ${url}`
      : `กำลังสร้างภาพมอบหรีด เก็บลิงก์นี้ไว้เพื่อกลับมารับภาพภายหลัง: ${url}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function shareLink() {
    const url = job?.jobUrl || window.location.href;
    if (navigator.share) {
      const ready = job?.status === "completed" && job.imageUrl;
      await navigator.share({
        title: ready ? "ภาพมอบหรีดพร้อมแล้ว" : "กำลังสร้างภาพมอบหรีด",
        text: ready
          ? "เปิดลิงก์นี้เพื่อบันทึกหรือแชร์ภาพมอบหรีด"
          : "เก็บลิงก์นี้ไว้ แล้วกลับมาเปิดเพื่อรับภาพมอบหรีดภายหลัง",
        url,
      });
      return;
    }
    await copyLink();
  }

  const status = job?.status ?? "pending";
  const isDone = status === "completed" && job?.imageUrl;
  const isFailed = status === "failed";
  const statusCardClass = isDone
    ? "border-emerald-200 bg-emerald-50"
    : isFailed
    ? "border-red-200 bg-red-50"
    : "border-gold-200 bg-cream-50";
  const statusTextClass = isDone
    ? "text-emerald-800"
    : isFailed
    ? "text-red-700"
    : "text-gold-800";
  const detailTextClass = isDone
    ? "text-emerald-700"
    : isFailed
    ? "text-red-600"
    : "text-gold-500";

  return (
    <div className="min-h-dvh flex flex-col bg-white">
      <IosPageHeader title="หรีดร่วมบุญ" subtitle="AI Photo" backHref="/" />
      <main className="flex-1">
        <div className="mx-auto max-w-lg px-4 py-5 space-y-4">
          <div className={`rounded-2xl border card-shadow p-4 space-y-3 ${statusCardClass}`}>
            <div className="flex items-center gap-2">
              {isDone ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : isFailed ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-gold-500" />
              )}
              <div>
                <p className={`text-sm font-bold ${statusTextClass}`}>
                  {isDone
                    ? "ภาพมอบหรีดพร้อมแล้ว"
                    : isFailed
                    ? "สร้างภาพไม่สำเร็จ"
                    : "กำลังสร้างภาพมอบหรีด"}
                </p>
                <p className={`text-[11px] leading-relaxed ${detailTextClass}`}>
                  {isDone
                    ? "บันทึกภาพลงเครื่อง หรือแชร์ภาพจากปุ่มด้านล่างได้เลย"
                    : isFailed
                    ? job?.error ?? "กรุณาลองสร้างใหม่อีกครั้ง"
                    : "งานกำลังประมวลผลบนระบบ สามารถปิดหน้านี้ คัดลอกลิงก์ไว้ แล้วกลับมาเปิดเพื่อรับภาพภายหลังได้"}
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
                {copied ? "คัดลอกแล้ว" : "คัดลอกข้อความลิงก์"}
              </button>
              <button
                type="button"
                onClick={shareLink}
                className="flex items-center justify-center gap-2 rounded-xl gold-gradient px-3 py-2.5 text-xs font-bold text-white"
              >
                <Share2 className="h-4 w-4" />
                แชร์
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
