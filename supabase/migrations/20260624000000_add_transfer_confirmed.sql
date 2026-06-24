-- เพิ่มคอลัมน์ยืนยันการโอนเงินให้เจ้าภาพ
-- ใช้โดย POST /api/memorials/[id]/confirm-transfer + TransferConfirmButton
-- ถ้าไม่มีคอลัมน์นี้ ศูนย์จะยืนยันการโอนเงินให้เจ้าภาพไม่ได้ (query error → 404)

ALTER TABLE memorials
  ADD COLUMN IF NOT EXISTS transfer_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS transfer_confirmed_by TEXT;
