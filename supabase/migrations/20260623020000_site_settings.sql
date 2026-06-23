-- ตั้งค่าระดับระบบ (key-value) — แอดมินกลางแก้ได้
-- ใช้เก็บภาพแบนเนอร์ "ตัวอย่างบอร์ดหรีดร่วมบุญ" บนหน้าแรกของทุกงาน (ผู้สนับสนุนโครงการ)
CREATE TABLE IF NOT EXISTS site_settings (
  key        text PRIMARY KEY,
  value      text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
