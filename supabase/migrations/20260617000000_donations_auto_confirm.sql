-- ระบบรับเงินร่วมบุญอัตโนมัติ ไม่มีขั้นตอนอนุมัติสลิป
-- donations.status DEFAULT เปลี่ยนจาก 'pending' เป็น 'confirmed'
ALTER TABLE donations ALTER COLUMN status SET DEFAULT 'confirmed';
