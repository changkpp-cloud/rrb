-- Migration: Add official_lgo_code to centers table
-- Run this in Supabase SQL Editor

-- 1. Add official_lgo_code column (8-digit Ministry of Interior standard code)
ALTER TABLE centers ADD COLUMN IF NOT EXISTS official_lgo_code TEXT;

-- 2. Unique index (NULL allowed for non-LGO centers)
CREATE UNIQUE INDEX IF NOT EXISTS centers_official_lgo_code_unique
  ON centers (official_lgo_code)
  WHERE official_lgo_code IS NOT NULL;

-- 3. Ensure center_code is also unique
CREATE UNIQUE INDEX IF NOT EXISTS centers_center_code_unique
  ON centers (center_code)
  WHERE center_code IS NOT NULL;

-- 4. Update existing centers (fill in correct 8-digit LGO codes)
-- Example — update with actual codes from กรมส่งเสริมการปกครองท้องถิ่น
-- UPDATE centers SET official_lgo_code = '04270101', center_code = 'RRB-04270101'
--   WHERE name LIKE '%สระแก้ว%';
-- UPDATE centers SET official_lgo_code = '05620701', center_code = 'RRB-05620701'
--   WHERE name LIKE '%พรานกระต่าย%';
