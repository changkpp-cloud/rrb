-- ============================================================
-- หรีดร่วมบุญ Zero Waste — Full Database Schema
-- วิ่งใน Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. CENTERS
-- ============================================================
CREATE TABLE IF NOT EXISTS centers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  municipality TEXT,
  tambon       TEXT,
  amphoe       TEXT,
  province     TEXT,
  manager_name TEXT,
  phone        TEXT,
  status       TEXT NOT NULL DEFAULT 'active'
               CHECK (status IN ('active','inactive')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. MEMORIALS
-- ============================================================
CREATE TABLE IF NOT EXISTS memorials (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                   TEXT UNIQUE,
  center_id              UUID REFERENCES centers(id) ON DELETE SET NULL,
  name                   TEXT NOT NULL,
  birth_date             DATE,
  death_date             DATE,
  age                    INT,
  photo_url              TEXT,
  ceremony_date          DATE NOT NULL,
  ceremony_time          TEXT DEFAULT '',
  ceremony_location      TEXT NOT NULL DEFAULT '',
  ceremony_hall          TEXT,
  prayer_date            DATE,
  prayer_location        TEXT,
  host_name              TEXT,
  host_phone             TEXT,
  host_code              TEXT UNIQUE,
  funeral_status         TEXT NOT NULL DEFAULT 'active'
                         CHECK (funeral_status IN ('draft','active','closed')),
  is_active              BOOLEAN NOT NULL DEFAULT TRUE,
  bank_name              TEXT NOT NULL DEFAULT '',
  bank_account_number    TEXT NOT NULL DEFAULT '',
  bank_account_name      TEXT NOT NULL DEFAULT '',
  bank_account_image_url TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. DONATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS donations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id      UUID NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  donor_name       TEXT NOT NULL,
  donor_title      TEXT,
  message          TEXT,
  amount           NUMERIC(10,2) NOT NULL DEFAULT 0,
  slip_url         TEXT,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','confirmed','rejected')),
  nameplate_status TEXT NOT NULL DEFAULT 'pending'
                   CHECK (nameplate_status IN ('pending','queued','printed','posted')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. NAMEPLATES
-- ============================================================
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

-- ============================================================
-- 5. PRINT_JOBS
-- ============================================================
CREATE TABLE IF NOT EXISTS print_jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nameplate_id  UUID NOT NULL REFERENCES nameplates(id) ON DELETE CASCADE,
  printer_id    TEXT,
  status        TEXT NOT NULL DEFAULT 'queued'
                CHECK (status IN ('queued','printing','printed','error')),
  queued_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  printed_at    TIMESTAMPTZ,
  printed_by    TEXT,
  error_message TEXT
);

ALTER TABLE nameplates
  ADD COLUMN IF NOT EXISTS print_job_id_fk UUID REFERENCES print_jobs(id) ON DELETE SET NULL;

-- ============================================================
-- 6. EQUIPMENT
-- ============================================================
CREATE TABLE IF NOT EXISTS equipment (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id            UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  type                 TEXT NOT NULL CHECK (type IN ('board','printer','flower_box','other')),
  name                 TEXT NOT NULL,
  status               TEXT NOT NULL DEFAULT 'available'
                       CHECK (status IN ('available','in_use','maintenance','returned')),
  current_memorial_id  UUID REFERENCES memorials(id) ON DELETE SET NULL,
  location             TEXT,
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 7. REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id      UUID NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  center_id        UUID REFERENCES centers(id) ON DELETE SET NULL,
  total_amount     NUMERIC(10,2) NOT NULL DEFAULT 0,
  donor_count      INT NOT NULL DEFAULT 0,
  service_fee      NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_amount       NUMERIC(10,2) NOT NULL DEFAULT 0,
  wreaths_reduced  INT NOT NULL DEFAULT 0,
  waste_reduced_kg NUMERIC(8,2) NOT NULL DEFAULT 0,
  closed_at        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 8. AUDIT_LOGS
-- ============================================================
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
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_memorials_center_id      ON memorials(center_id);
CREATE INDEX IF NOT EXISTS idx_memorials_funeral_status ON memorials(funeral_status);
CREATE INDEX IF NOT EXISTS idx_memorials_is_active      ON memorials(is_active);
CREATE INDEX IF NOT EXISTS idx_memorials_host_code      ON memorials(host_code);
CREATE INDEX IF NOT EXISTS idx_donations_memorial_id    ON donations(memorial_id);
CREATE INDEX IF NOT EXISTS idx_donations_status         ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_created_at     ON donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nameplates_memorial_id   ON nameplates(memorial_id);
CREATE INDEX IF NOT EXISTS idx_nameplates_print_status  ON nameplates(print_status);
CREATE INDEX IF NOT EXISTS idx_print_jobs_nameplate_id  ON print_jobs(nameplate_id);
CREATE INDEX IF NOT EXISTS idx_print_jobs_status        ON print_jobs(status);
CREATE INDEX IF NOT EXISTS idx_equipment_center_id      ON equipment(center_id);
CREATE INDEX IF NOT EXISTS idx_reports_memorial_id      ON reports(memorial_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at    ON audit_logs(created_at DESC);
