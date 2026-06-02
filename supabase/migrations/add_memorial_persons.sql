-- Migration: memorial_persons table
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS memorial_persons (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id   UUID NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL,
  relationship  TEXT NOT NULL,
  role_in_photo TEXT NOT NULL DEFAULT 'ผู้รับมอบ',
  photo_url     TEXT,
  allow_in_sim  BOOLEAN NOT NULL DEFAULT true,
  is_primary    BOOLEAN NOT NULL DEFAULT false,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS memorial_persons_memorial_id_idx
  ON memorial_persons (memorial_id);
