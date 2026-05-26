-- ============================================================
-- หรีดร่วมบุญ Zero Waste — Database Schema Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Centers table
CREATE TABLE IF NOT EXISTS centers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  municipality TEXT,
  tambon       TEXT,
  amphoe       TEXT,
  province     TEXT,
  manager_name TEXT,
  phone        TEXT,
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add new columns to existing memorials table
ALTER TABLE memorials
  ADD COLUMN IF NOT EXISTS center_id       UUID REFERENCES centers(id),
  ADD COLUMN IF NOT EXISTS prayer_date     TEXT,
  ADD COLUMN IF NOT EXISTS prayer_location TEXT,
  ADD COLUMN IF NOT EXISTS host_name       TEXT,
  ADD COLUMN IF NOT EXISTS host_phone      TEXT,
  ADD COLUMN IF NOT EXISTS host_code       TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS funeral_status  TEXT NOT NULL DEFAULT 'active'
    CHECK (funeral_status IN ('draft','active','closed'));

-- 3. Add new columns to donations table
ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS donor_title      TEXT,
  ADD COLUMN IF NOT EXISTS nameplate_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (nameplate_status IN ('pending','queued','printed','posted'));

-- 4. Nameplates table
CREATE TABLE IF NOT EXISTS nameplates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id  UUID REFERENCES donations(id) ON DELETE SET NULL,
  memorial_id  UUID NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  donor_name   TEXT NOT NULL,
  donor_title  TEXT,
  message      TEXT,
  pdf_url      TEXT,
  print_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (print_status IN ('pending','queued','printing','printed','error','reprint')),
  board_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (board_status IN ('pending','posted')),
  print_job_id UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Print jobs table
CREATE TABLE IF NOT EXISTS print_jobs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nameplate_id UUID NOT NULL REFERENCES nameplates(id) ON DELETE CASCADE,
  printer_id   TEXT,
  status       TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','printing','printed','error')),
  queued_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  printed_at   TIMESTAMPTZ,
  printed_by   TEXT,
  error_message TEXT
);

-- Foreign key from nameplates.print_job_id → print_jobs.id
ALTER TABLE nameplates
  ADD CONSTRAINT fk_nameplates_print_job
  FOREIGN KEY (print_job_id) REFERENCES print_jobs(id) ON DELETE SET NULL;

-- 6. Equipment table
CREATE TABLE IF NOT EXISTS equipment (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id           UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  type                TEXT NOT NULL CHECK (type IN ('board','printer','flower_box','other')),
  name                TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available','in_use','maintenance','returned')),
  current_memorial_id UUID REFERENCES memorials(id) ON DELETE SET NULL,
  location            TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Reports table (closed funeral summaries)
CREATE TABLE IF NOT EXISTS reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id      UUID NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  center_id        UUID REFERENCES centers(id) ON DELETE SET NULL,
  total_amount     NUMERIC NOT NULL DEFAULT 0,
  donor_count      INTEGER NOT NULL DEFAULT 0,
  service_fee      NUMERIC NOT NULL DEFAULT 0,
  net_amount       NUMERIC NOT NULL DEFAULT 0,
  wreaths_reduced  INTEGER NOT NULL DEFAULT 0,
  waste_reduced_kg NUMERIC NOT NULL DEFAULT 0,
  closed_at        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT,
  action     TEXT NOT NULL,
  table_name TEXT,
  record_id  TEXT,
  old_value  JSONB,
  new_value  JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_memorials_center_id      ON memorials(center_id);
CREATE INDEX IF NOT EXISTS idx_memorials_funeral_status  ON memorials(funeral_status);
CREATE INDEX IF NOT EXISTS idx_memorials_is_active       ON memorials(is_active);
CREATE INDEX IF NOT EXISTS idx_donations_memorial_id     ON donations(memorial_id);
CREATE INDEX IF NOT EXISTS idx_donations_status          ON donations(status);
CREATE INDEX IF NOT EXISTS idx_nameplates_memorial_id    ON nameplates(memorial_id);
CREATE INDEX IF NOT EXISTS idx_nameplates_print_status   ON nameplates(print_status);
CREATE INDEX IF NOT EXISTS idx_print_jobs_nameplate_id   ON print_jobs(nameplate_id);
CREATE INDEX IF NOT EXISTS idx_print_jobs_status         ON print_jobs(status);
CREATE INDEX IF NOT EXISTS idx_equipment_center_id       ON equipment(center_id);
CREATE INDEX IF NOT EXISTS idx_reports_memorial_id       ON reports(memorial_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at     ON audit_logs(created_at DESC);

-- ============================================================
-- Row Level Security (enable per table as needed)
-- ============================================================
-- ALTER TABLE centers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE memorials ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE nameplates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE print_jobs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
