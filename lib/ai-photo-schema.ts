export const AI_PHOTO_SCHEMA_ERROR =
  "ระบบลิงก์รับภาพยังไม่พร้อมใช้งาน กรุณาติดตั้งตาราง ai_photo_requests และ ai_photo_credits ใน Supabase ก่อน";

export function isMissingAiPhotoSchemaError(error: unknown) {
  const message =
    typeof error === "object" && error && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : String(error ?? "");

  return (
    message.includes("ai_photo_requests") ||
    message.includes("ai_photo_credits") ||
    message.includes("schema cache") ||
    message.includes("Could not find the table")
  );
}
