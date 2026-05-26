-- ============================================================
-- หรีดร่วมบุญ — Seed Data (ข้อมูลตัวอย่างเริ่มต้น)
-- รันหลังจาก schema.sql แล้ว
-- ============================================================

-- ============================================================
-- งานศพตัวอย่าง (แก้ไขข้อมูลให้ตรงกับงานจริง)
-- ============================================================
INSERT INTO memorials (
  id,
  slug,
  name,
  birth_date,
  death_date,
  age,
  photo_url,
  ceremony_date,
  ceremony_time,
  ceremony_location,
  ceremony_hall,
  prayer_date,
  prayer_location,
  host_name,
  host_phone,
  host_code,
  funeral_status,
  is_active,
  bank_name,
  bank_account_number,
  bank_account_name,
  bank_account_image_url
)
VALUES (
  gen_random_uuid(),
  'supaborn-2567',                            -- URL slug (แก้ไขได้)
  'นางสาว สุภาพร ปทุมานนท์',                 -- ชื่อผู้เสียชีวิต
  '1988-06-19',                               -- วันเกิด (YYYY-MM-DD)
  '2024-03-16',                               -- วันถึงแก่กรรม
  35,                                         -- อายุ (ปี)
  NULL,                                       -- URL รูปภาพ (อัพโหลดทีหลัง)
  '2024-03-20',                               -- วันฌาปนกิจ
  '16.00',                                    -- เวลา
  'วัดไตรภูมิ',                               -- วัด/สถานที่
  'ต.พรานกระต่าย อ.พรานกระต่าย จ.กำแพงเพชร', -- ที่อยู่/ศาลา
  '2024-03-17',                               -- วันสวด
  'วัดไตรภูมิ',                               -- สถานที่สวด
  'นายสมศักดิ์ ปทุมานนท์',                   -- ชื่อเจ้าภาพ
  '0812345678',                               -- เบอร์เจ้าภาพ
  'H001AB',                                   -- รหัสเจ้าภาพ (เปลี่ยนได้)
  'active',
  true,
  E'มูลนิธิหรีดร่วมบุญ ESG Zero Waste\nธนาคารกรุงไทย', -- bank_name (2 บรรทัด)
  '6200358257',                               -- เลขบัญชี
  'มูลนิธิหรีดร่วมบุญ ESG Zero Waste',        -- ชื่อบัญชี
  NULL                                        -- URL รูป QR Code
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- ข้อมูลผู้ร่วมบุญตัวอย่าง (ใช้ id ของ memorial ด้านบน)
-- ============================================================
-- หมายเหตุ: แทนที่ '00000000-0000-0000-0000-000000000000'
-- ด้วย id ของ memorial ที่สร้างขึ้นจาก INSERT ด้านบน
-- สามารถดู id ได้จาก: SELECT id FROM memorials WHERE slug = 'supaborn-2567';

/*
INSERT INTO donations (memorial_id, donor_name, donor_title, amount, status, nameplate_status)
VALUES
  ('ใส่-memorial-id-ที่นี่', 'นายสมชาย ใจดี',   'ผู้อำนวยการ',    500,  'confirmed', 'posted'),
  ('ใส่-memorial-id-ที่นี่', 'นางสาวมาลี รักดี', NULL,             300,  'confirmed', 'printed'),
  ('ใส่-memorial-id-ที่นี่', 'บริษัท ABC จำกัด',  NULL,             1000, 'confirmed', 'queued'),
  ('ใส่-memorial-id-ที่นี่', 'นายวิชัย เจริญ',    'นายกเทศมนตรี',  500,  'pending',   'pending');
*/
