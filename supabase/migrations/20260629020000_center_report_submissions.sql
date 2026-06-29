-- บันทึกว่าศูนย์ "ส่งรายงานงวดไหนให้ อปท. แล้ว" → ใช้ทำ compliance tracker ให้ อปท. ติดตาม
-- ศูนย์ (manager/staff) กดทำเครื่องหมายบนหน้า report · อปท. (lgo_observer) ดูสถานะอย่างเดียว
CREATE TABLE IF NOT EXISTS center_report_submissions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id    uuid        NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  period_type  text        NOT NULL CHECK (period_type IN ('month','year')),
  period_key   text        NOT NULL,                 -- 'YYYY-MM' หรือ 'YYYY'
  submitted_at timestamptz NOT NULL DEFAULT now(),
  submitted_by text,                                 -- ชื่อ/บทบาทผู้กด
  note         text,
  UNIQUE (center_id, period_type, period_key)
);

CREATE INDEX IF NOT EXISTS center_report_submissions_center_idx
  ON center_report_submissions (center_id, period_type, period_key);
