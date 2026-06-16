import type { Metadata } from "next";
import AiPhotoJobPageClient from "./page-client";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

type JobStatus = "pending" | "processing" | "completed" | "failed";
type JobMeta = {
  status: JobStatus;
  imageUrl: string | null;
};

async function getJobMeta(id: string): Promise<JobMeta | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await (supabase.from("ai_photo_requests") as any)
      .select("status, generated_image_url")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    const row = data as { status?: JobStatus; generated_image_url?: string | null };
    return {
      status: row.status ?? "pending",
      imageUrl: row.generated_image_url ?? null,
    };
  } catch {
    return null;
  }
}

function getStatusText(status: JobStatus | undefined, imageUrl: string | null | undefined) {
  if (status === "completed" && imageUrl) {
    return {
      title: "ภาพมอบหรีดพร้อมแล้ว | หรีดร่วมบุญ",
      description: "บันทึกภาพมอบหรีด AI ลงเครื่อง หรือแชร์ภาพต่อได้เลย",
    };
  }

  if (status === "failed") {
    return {
      title: "สร้างภาพมอบหรีดไม่สำเร็จ | หรีดร่วมบุญ",
      description: "ตรวจสอบสถานะ และลองสร้างภาพมอบหรีดใหม่อีกครั้ง",
    };
  }

  return {
    title: "กำลังสร้างภาพมอบหรีด | หรีดร่วมบุญ",
    description: "ระบบกำลังสร้างภาพมอบหรีด AI กรุณารอสักครู่เพื่อรับภาพเมื่อเจนเสร็จ",
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const job = await getJobMeta(id);
  const { title, description } = getStatusText(job?.status, job?.imageUrl);
  const url = `${getSiteUrl()}/ai-photo/jobs/${id}`;
  const images = job?.status === "completed" && job.imageUrl
    ? [{ url: job.imageUrl, alt: "ภาพมอบหรีดพร้อมแล้ว" }]
    : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "หรีดร่วมบุญ",
      type: "website",
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      images: job?.imageUrl ? [job.imageUrl] : undefined,
    },
  };
}

export default async function AiPhotoJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AiPhotoJobPageClient jobId={id} />;
}
