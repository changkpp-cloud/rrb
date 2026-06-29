-- เพิ่ม role "อปท. (ผู้กำกับดูแล)" = lgo_observer
-- read-only: เข้าดูแดชบอร์ดศูนย์ในเขตตัวเอง + ดึง/ส่งออกรายงานได้ แต่แก้ไข/เปิดงานไม่ได้ (ไม่เห็น PII)
-- ผูกผ่าน center_memberships เหมือน role อื่น — เงื่อนไขสิทธิ์อยู่ที่ lib/iam-utils.ts
-- NOTE: ALTER TYPE ... ADD VALUE ต้องเป็น statement แยก และค่าใหม่ใช้ใน transaction เดียวกันไม่ได้
ALTER TYPE public.app_user_role ADD VALUE IF NOT EXISTS 'lgo_observer';
