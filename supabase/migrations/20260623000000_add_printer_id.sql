-- เพิ่มคอลัมน์ printer_id (PrintNode Printer ID) ต่อหนึ่งงานศพ
-- ใช้สั่งพิมพ์ป้ายชื่ออัตโนมัติเมื่อมีผู้มอบหรีดร่วมบุญ
-- ก่อนหน้านี้คอลัมน์นี้ไม่มีใน DB ทำให้ insert งานศพ fallback แล้วทิ้ง host_code

ALTER TABLE memorials ADD COLUMN IF NOT EXISTS printer_id text;
