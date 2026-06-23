-- ที่ตั้งงานฌาปนกิจ — รหัสมาตรฐานกรมการปกครอง (ผูกกับ อปท. ได้) + ชื่อสำหรับแสดงผล
-- province=2 หลัก, district(อำเภอ)=4 หลัก, subdistrict(ตำบล)=6 หลัก, postal=รหัสไปรษณีย์
ALTER TABLE memorials ADD COLUMN IF NOT EXISTS ceremony_province_code     integer;
ALTER TABLE memorials ADD COLUMN IF NOT EXISTS ceremony_province_name     text;
ALTER TABLE memorials ADD COLUMN IF NOT EXISTS ceremony_district_code     integer;
ALTER TABLE memorials ADD COLUMN IF NOT EXISTS ceremony_district_name     text;
ALTER TABLE memorials ADD COLUMN IF NOT EXISTS ceremony_subdistrict_code  integer;
ALTER TABLE memorials ADD COLUMN IF NOT EXISTS ceremony_subdistrict_name  text;
ALTER TABLE memorials ADD COLUMN IF NOT EXISTS ceremony_postal_code       integer;
