-- ยืนยันบัญชีเจ้าภาพด้วย OTP (เงินเข้าบัญชีเจ้าภาพโดยตรง → ต้องยืนยันว่าเป็นเบอร์/บัญชีตัวจริง)
-- host_phone_verified = ยืนยันเบอร์ด้วย OTP แล้ว (ใช้เบอร์นี้สร้าง PromptPay QR หน้าโอน)
-- host_otp_code / host_otp_expires_at = รหัส OTP ปัจจุบัน + เวลาหมดอายุ (mock: ยังไม่ส่ง SMS จริง)

ALTER TABLE memorials
  ADD COLUMN IF NOT EXISTS host_phone_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS host_otp_code text,
  ADD COLUMN IF NOT EXISTS host_otp_expires_at timestamptz;

-- OTP "ก่อนเปิดงาน": ตอนกรอกฟอร์มเปิดงานยังไม่มี memorial → ผูก OTP กับ (ศูนย์ + เบอร์เจ้าภาพ)
-- เจ้าหน้าที่ศูนย์กดส่งรหัสไปเบอร์ผู้มาแจ้งเปิดงาน → ผู้แจ้งบอกรหัสกลับ → ยืนยัน → เปิดงานได้
-- create API จะเช็กว่ามีแถวที่ verified_at ภายในกรอบเวลา (OTP_VERIFY_WINDOW_MS) ก่อนตั้ง host_phone_verified
CREATE TABLE IF NOT EXISTS host_otp_requests (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id   uuid        NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  phone       text        NOT NULL,
  code        text        NOT NULL,
  expires_at  timestamptz NOT NULL,
  verified_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS host_otp_requests_center_phone_idx
  ON host_otp_requests (center_id, phone, created_at DESC);
