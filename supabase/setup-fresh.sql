-- ================================================================
-- หรีดร่วมบุญ (RRB) — Fresh Database Setup
-- วิ่งใน Supabase Dashboard → SQL Editor → New Query → Run All
-- ใช้สำหรับ project ใหม่ที่ยังไม่มี table ใดเลย
-- ================================================================

-- ── Extensions ──────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Enums ───────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.app_user_role AS ENUM ('super_admin','center_manager','center_staff','center_viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.app_user_status AS ENUM ('pending','active','suspended','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.auth_provider AS ENUM ('password','email','line','facebook','google');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ================================================================
-- 1. CENTERS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.centers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  center_code       TEXT,
  official_lgo_code TEXT,
  municipality      TEXT,
  tambon            TEXT,
  amphoe            TEXT,
  province          TEXT,
  manager_name      TEXT,
  phone             TEXT,
  access_code       TEXT,
  status            TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','inactive')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS centers_center_code_unique
  ON public.centers (center_code) WHERE center_code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS centers_official_lgo_code_unique
  ON public.centers (official_lgo_code) WHERE official_lgo_code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS centers_access_code_unique
  ON public.centers (access_code) WHERE access_code IS NOT NULL;

-- ================================================================
-- 2. MEMORIALS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.memorials (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                     TEXT UNIQUE,
  event_code               TEXT UNIQUE,
  center_id                UUID REFERENCES public.centers(id) ON DELETE SET NULL,
  name                     TEXT NOT NULL,
  birth_date               DATE,
  death_date               DATE,
  age                      INT,
  photo_url                TEXT,
  ceremony_date            DATE NOT NULL,
  ceremony_time            TEXT DEFAULT '',
  ceremony_location        TEXT NOT NULL DEFAULT '',
  ceremony_hall            TEXT,
  prayer_date              DATE,
  prayer_location          TEXT,
  host_name                TEXT,
  host_phone               TEXT,
  host_code                TEXT UNIQUE,
  host_relationship        TEXT,
  funeral_status           TEXT NOT NULL DEFAULT 'active'
                           CHECK (funeral_status IN ('draft','active','closed')),
  is_active                BOOLEAN NOT NULL DEFAULT TRUE,
  bank_name                TEXT NOT NULL DEFAULT '',
  bank_account_number      TEXT NOT NULL DEFAULT '',
  bank_account_name        TEXT NOT NULL DEFAULT '',
  bank_account_image_url   TEXT,
  host_bank_name           TEXT,
  host_bank_account_number TEXT,
  host_bank_account_name   TEXT,
  death_certificate_url    TEXT,
  host_id_card_url         TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memorials_center_id      ON public.memorials(center_id);
CREATE INDEX IF NOT EXISTS idx_memorials_funeral_status ON public.memorials(funeral_status);
CREATE INDEX IF NOT EXISTS idx_memorials_is_active      ON public.memorials(is_active);
CREATE INDEX IF NOT EXISTS idx_memorials_host_code      ON public.memorials(host_code);

-- ================================================================
-- 3. DONATIONS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.donations (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id            UUID NOT NULL REFERENCES public.memorials(id) ON DELETE CASCADE,
  center_id              UUID REFERENCES public.centers(id) ON DELETE SET NULL,
  donor_name             TEXT NOT NULL,
  donor_title            TEXT,
  message                TEXT,
  amount                 NUMERIC(10,2) NOT NULL DEFAULT 0,
  slip_url               TEXT,
  slip_hash              TEXT,
  slip_duplicate_warning BOOLEAN NOT NULL DEFAULT FALSE,
  status                 TEXT NOT NULL DEFAULT 'confirmed'
                         CHECK (status IN ('pending','confirmed','rejected')),
  nameplate_status       TEXT NOT NULL DEFAULT 'pending'
                         CHECK (nameplate_status IN ('pending','queued','printed','posted')),
  confirmed_at           TIMESTAMPTZ,
  reviewed_at            TIMESTAMPTZ,
  reviewed_by            TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donations_memorial_id          ON public.donations(memorial_id);
CREATE INDEX IF NOT EXISTS idx_donations_memorial_slip_hash   ON public.donations(memorial_id, slip_hash) WHERE slip_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_donations_status               ON public.donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_created_at           ON public.donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_center_created       ON public.donations(center_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_center_status_created ON public.donations(center_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_memorial_status_created ON public.donations(memorial_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_center_nameplate     ON public.donations(center_id, nameplate_status, created_at DESC);

-- ================================================================
-- 4. NAMEPLATES
-- ================================================================
CREATE TABLE IF NOT EXISTS public.nameplates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id  UUID REFERENCES public.donations(id) ON DELETE SET NULL,
  memorial_id  UUID NOT NULL REFERENCES public.memorials(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_nameplates_memorial_id  ON public.nameplates(memorial_id);
CREATE INDEX IF NOT EXISTS idx_nameplates_print_status ON public.nameplates(print_status);

-- ================================================================
-- 5. PRINT_JOBS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.print_jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nameplate_id  UUID NOT NULL REFERENCES public.nameplates(id) ON DELETE CASCADE,
  printer_id    TEXT,
  status        TEXT NOT NULL DEFAULT 'queued'
                CHECK (status IN ('queued','printing','printed','error')),
  queued_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  printed_at    TIMESTAMPTZ,
  printed_by    TEXT,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_print_jobs_nameplate_id ON public.print_jobs(nameplate_id);
CREATE INDEX IF NOT EXISTS idx_print_jobs_status       ON public.print_jobs(status);

-- ================================================================
-- 6. SLIP_SUBMISSIONS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.slip_submissions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id        UUID NOT NULL REFERENCES public.memorials(id) ON DELETE CASCADE,
  slip_hash          TEXT NOT NULL,
  slip_url           TEXT,
  duplicate_detected BOOLEAN NOT NULL DEFAULT FALSE,
  duplicate_of       UUID REFERENCES public.slip_submissions(id) ON DELETE SET NULL,
  review_status      TEXT NOT NULL DEFAULT 'none'
                     CHECK (review_status IN ('none','needs_review','reviewed','ignored')),
  first_seen_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_slip_submissions_memorial_hash
  ON public.slip_submissions(memorial_id, slip_hash, first_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_slip_submissions_memorial_id
  ON public.slip_submissions(memorial_id, first_seen_at DESC);

-- ================================================================
-- 7. EQUIPMENT
-- ================================================================
CREATE TABLE IF NOT EXISTS public.equipment (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id           UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  type                TEXT NOT NULL CHECK (type IN ('board','printer','flower_box','other')),
  name                TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'available'
                      CHECK (status IN ('available','in_use','maintenance','returned')),
  current_memorial_id UUID REFERENCES public.memorials(id) ON DELETE SET NULL,
  location            TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_center_id ON public.equipment(center_id);

-- ================================================================
-- 8. REPORTS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id      UUID NOT NULL REFERENCES public.memorials(id) ON DELETE CASCADE,
  center_id        UUID REFERENCES public.centers(id) ON DELETE SET NULL,
  total_amount     NUMERIC(10,2) NOT NULL DEFAULT 0,
  donor_count      INT NOT NULL DEFAULT 0,
  service_fee      NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_amount       NUMERIC(10,2) NOT NULL DEFAULT 0,
  wreaths_reduced  INT NOT NULL DEFAULT 0,
  waste_reduced_kg NUMERIC(8,2) NOT NULL DEFAULT 0,
  closed_at        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_memorial_id ON public.reports(memorial_id);

-- ================================================================
-- 9. IAM — APP_USERS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.app_users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            TEXT UNIQUE,
  display_name     TEXT NOT NULL,
  phone            TEXT,
  auth_provider    public.auth_provider NOT NULL DEFAULT 'password',
  provider_user_id TEXT,
  password_hash    TEXT,
  global_role      public.app_user_role,
  status           public.app_user_status NOT NULL DEFAULT 'pending',
  approved_by      UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  approved_at      TIMESTAMPTZ,
  last_login_at    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS app_users_email_idx ON public.app_users (lower(email));

-- ================================================================
-- 10. AUDIT_LOGS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT,
  actor_user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  actor_role    TEXT,
  center_id     UUID REFERENCES public.centers(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  table_name    TEXT,
  record_id     TEXT,
  old_value     JSONB,
  new_value     JSONB,
  ip_address    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ================================================================
-- 11. IAM — CENTER_MEMBERSHIPS, CENTER_USER_REQUESTS, SESSIONS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.center_memberships (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id   UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  role        public.app_user_role NOT NULL DEFAULT 'center_staff',
  status      public.app_user_status NOT NULL DEFAULT 'active',
  approved_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(center_id, user_id)
);

CREATE INDEX IF NOT EXISTS center_memberships_center_idx ON public.center_memberships(center_id);
CREATE INDEX IF NOT EXISTS center_memberships_user_idx   ON public.center_memberships(user_id);

CREATE TABLE IF NOT EXISTS public.center_user_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id        UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  email            TEXT NOT NULL,
  display_name     TEXT NOT NULL,
  phone            TEXT,
  requested_role   public.app_user_role NOT NULL DEFAULT 'center_staff',
  auth_provider    public.auth_provider NOT NULL DEFAULT 'password',
  provider_user_id TEXT,
  password_hash    TEXT,
  status           public.app_user_status NOT NULL DEFAULT 'pending',
  approved_user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  reviewed_by      UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  reviewed_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS center_user_requests_status_idx
  ON public.center_user_requests(status, center_id);

CREATE TABLE IF NOT EXISTS public.app_user_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS app_user_sessions_user_idx
  ON public.app_user_sessions(user_id, expires_at);

-- ================================================================
-- 12. MEMORIAL_PERSONS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.memorial_persons (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id   UUID NOT NULL REFERENCES public.memorials(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL,
  relationship  TEXT NOT NULL,
  role_in_photo TEXT NOT NULL DEFAULT 'ผู้รับมอบ',
  photo_url     TEXT,
  allow_in_sim  BOOLEAN NOT NULL DEFAULT TRUE,
  is_primary    BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS memorial_persons_memorial_id_idx ON public.memorial_persons(memorial_id);

-- ================================================================
-- 13. AI_PHOTO_TEMPLATES
-- ================================================================
CREATE TABLE IF NOT EXISTS public.ai_photo_templates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name     TEXT NOT NULL,
  template_key      TEXT NOT NULL UNIQUE,
  description       TEXT,
  prompt_template   TEXT NOT NULL,
  negative_prompt   TEXT,
  required_inputs   JSONB NOT NULL DEFAULT '[]'::JSONB,
  preview_image_url TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order        INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- 14. AI_PHOTO_CREDITS & AI_PHOTO_REQUESTS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.ai_photo_credits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id TEXT NOT NULL UNIQUE,
  free_quota  INT NOT NULL DEFAULT 1,
  used_count  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_photo_credits_donation_id_idx ON public.ai_photo_credits(donation_id);

CREATE TABLE IF NOT EXISTS public.ai_photo_requests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id           TEXT,
  memorial_id           TEXT,
  template_key          TEXT NOT NULL,
  final_prompt          TEXT,
  reference_image_url   TEXT,
  generated_image_url   TEXT,
  status                TEXT NOT NULL DEFAULT 'completed'
                        CHECK (status IN ('pending','processing','completed','failed')),
  error_message         TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ai_photo_requests_donation_id_idx ON public.ai_photo_requests(donation_id);
CREATE INDEX IF NOT EXISTS ai_photo_requests_status_idx      ON public.ai_photo_requests(status);

-- ================================================================
-- 15. CENTER_DAILY_STATS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.center_daily_stats (
  center_id        UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  report_date      DATE NOT NULL,
  donation_count   INT NOT NULL DEFAULT 0,
  pending_count    INT NOT NULL DEFAULT 0,
  confirmed_count  INT NOT NULL DEFAULT 0,
  rejected_count   INT NOT NULL DEFAULT 0,
  total_amount     NUMERIC(14,2) NOT NULL DEFAULT 0,
  wreaths_reduced  INT NOT NULL DEFAULT 0,
  waste_reduced_kg NUMERIC(12,2) NOT NULL DEFAULT 0,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (center_id, report_date)
);

CREATE INDEX IF NOT EXISTS idx_center_daily_stats_date        ON public.center_daily_stats(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_center_daily_stats_center_date ON public.center_daily_stats(center_id, report_date DESC);

-- ================================================================
-- 16. PAYMENTS, OUTBOX_JOBS, CEREMONY_STATS, TENANT_STATS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id  UUID NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
  provider     TEXT NOT NULL,
  provider_ref TEXT NOT NULL,
  amount       NUMERIC NOT NULL,
  status       TEXT NOT NULL DEFAULT 'completed',
  metadata     JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT payments_provider_ref_unique UNIQUE (provider, provider_ref)
);

CREATE INDEX IF NOT EXISTS payments_donation_id_idx ON public.payments(donation_id);

CREATE TABLE IF NOT EXISTS public.outbox_jobs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type     TEXT NOT NULL,
  payload      JSONB NOT NULL DEFAULT '{}',
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','processing','completed','failed')),
  dedupe_key   TEXT UNIQUE,
  attempts     INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  last_error   TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  claimed_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS outbox_jobs_claimable_idx
  ON public.outbox_jobs(scheduled_at) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS public.ceremony_stats (
  memorial_id          UUID PRIMARY KEY REFERENCES public.memorials(id) ON DELETE CASCADE,
  total_donations      INT NOT NULL DEFAULT 0,
  confirmed_donations  INT NOT NULL DEFAULT 0,
  pending_donations    INT NOT NULL DEFAULT 0,
  rejected_donations   INT NOT NULL DEFAULT 0,
  total_amount         NUMERIC NOT NULL DEFAULT 0,
  wreaths_reduced      INT NOT NULL DEFAULT 0,
  last_donation_at     TIMESTAMPTZ,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tenant_stats (
  center_id            UUID PRIMARY KEY REFERENCES public.centers(id) ON DELETE CASCADE,
  total_memorials      INT NOT NULL DEFAULT 0,
  active_memorials     INT NOT NULL DEFAULT 0,
  closed_memorials     INT NOT NULL DEFAULT 0,
  total_donations      INT NOT NULL DEFAULT 0,
  confirmed_donations  INT NOT NULL DEFAULT 0,
  total_amount         NUMERIC NOT NULL DEFAULT 0,
  wreaths_reduced      INT NOT NULL DEFAULT 0,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- 17. FUNCTIONS & TRIGGERS
-- ================================================================

-- Sync center_id and confirmed_at on donations
CREATE OR REPLACE FUNCTION public.sync_donation_center_id()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.center_id IS NULL THEN
    SELECT center_id INTO NEW.center_id FROM public.memorials WHERE id = NEW.memorial_id;
  END IF;
  IF NEW.status = 'confirmed' AND NEW.confirmed_at IS NULL THEN
    NEW.confirmed_at = NOW();
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.reviewed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_donation_center_id ON public.donations;
CREATE TRIGGER trg_sync_donation_center_id
  BEFORE INSERT OR UPDATE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.sync_donation_center_id();

-- Refresh center_daily_stats
CREATE OR REPLACE FUNCTION public.refresh_center_daily_stats(p_center_id UUID, p_report_date DATE)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_center_id IS NULL OR p_report_date IS NULL THEN RETURN; END IF;
  INSERT INTO public.center_daily_stats (
    center_id, report_date, donation_count, pending_count,
    confirmed_count, rejected_count, total_amount, wreaths_reduced,
    waste_reduced_kg, updated_at
  )
  SELECT
    p_center_id, p_report_date,
    COUNT(*)::INT,
    COUNT(*) FILTER (WHERE status = 'pending')::INT,
    COUNT(*) FILTER (WHERE status = 'confirmed')::INT,
    COUNT(*) FILTER (WHERE status = 'rejected')::INT,
    COALESCE(SUM(amount) FILTER (WHERE status = 'confirmed'), 0),
    COUNT(*) FILTER (WHERE status = 'confirmed')::INT,
    (COUNT(*) FILTER (WHERE status = 'confirmed') * 2)::NUMERIC(12,2),
    NOW()
  FROM public.donations
  WHERE center_id = p_center_id
    AND created_at >= p_report_date::TIMESTAMPTZ
    AND created_at < (p_report_date + 1)::TIMESTAMPTZ
  ON CONFLICT (center_id, report_date) DO UPDATE SET
    donation_count  = EXCLUDED.donation_count,
    pending_count   = EXCLUDED.pending_count,
    confirmed_count = EXCLUDED.confirmed_count,
    rejected_count  = EXCLUDED.rejected_count,
    total_amount    = EXCLUDED.total_amount,
    wreaths_reduced = EXCLUDED.wreaths_reduced,
    waste_reduced_kg = EXCLUDED.waste_reduced_kg,
    updated_at      = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_center_daily_stats_trigger()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP IN ('UPDATE','DELETE') THEN
    PERFORM public.refresh_center_daily_stats(OLD.center_id, OLD.created_at::DATE);
  END IF;
  IF TG_OP IN ('INSERT','UPDATE') THEN
    PERFORM public.refresh_center_daily_stats(NEW.center_id, NEW.created_at::DATE);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_center_daily_stats ON public.donations;
CREATE TRIGGER trg_refresh_center_daily_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.refresh_center_daily_stats_trigger();

-- ceremony_stats
CREATE OR REPLACE FUNCTION public.fn_update_ceremony_stats()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.ceremony_stats (
      memorial_id, total_donations, pending_donations,
      confirmed_donations, rejected_donations, total_amount, wreaths_reduced, last_donation_at
    ) VALUES (
      NEW.memorial_id, 1,
      CASE WHEN NEW.status = 'pending'   THEN 1 ELSE 0 END,
      CASE WHEN NEW.status = 'confirmed' THEN 1 ELSE 0 END,
      CASE WHEN NEW.status = 'rejected'  THEN 1 ELSE 0 END,
      CASE WHEN NEW.status = 'confirmed' THEN NEW.amount ELSE 0 END,
      CASE WHEN NEW.status = 'confirmed' THEN 1 ELSE 0 END,
      NOW()
    )
    ON CONFLICT (memorial_id) DO UPDATE SET
      total_donations     = ceremony_stats.total_donations     + 1,
      pending_donations   = ceremony_stats.pending_donations   + CASE WHEN NEW.status='pending'   THEN 1 ELSE 0 END,
      confirmed_donations = ceremony_stats.confirmed_donations + CASE WHEN NEW.status='confirmed' THEN 1 ELSE 0 END,
      rejected_donations  = ceremony_stats.rejected_donations  + CASE WHEN NEW.status='rejected'  THEN 1 ELSE 0 END,
      total_amount        = ceremony_stats.total_amount        + CASE WHEN NEW.status='confirmed' THEN NEW.amount ELSE 0 END,
      wreaths_reduced     = ceremony_stats.wreaths_reduced     + CASE WHEN NEW.status='confirmed' THEN 1 ELSE 0 END,
      last_donation_at    = NOW(), updated_at = NOW();
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status <> NEW.status THEN
    UPDATE public.ceremony_stats SET
      pending_donations   = pending_donations   + CASE WHEN NEW.status='pending'   THEN 1 ELSE 0 END - CASE WHEN OLD.status='pending'   THEN 1 ELSE 0 END,
      confirmed_donations = confirmed_donations + CASE WHEN NEW.status='confirmed' THEN 1 ELSE 0 END - CASE WHEN OLD.status='confirmed' THEN 1 ELSE 0 END,
      rejected_donations  = rejected_donations  + CASE WHEN NEW.status='rejected'  THEN 1 ELSE 0 END - CASE WHEN OLD.status='rejected'  THEN 1 ELSE 0 END,
      total_amount        = total_amount        + CASE WHEN NEW.status='confirmed' THEN NEW.amount ELSE 0 END - CASE WHEN OLD.status='confirmed' THEN OLD.amount ELSE 0 END,
      wreaths_reduced     = wreaths_reduced     + CASE WHEN NEW.status='confirmed' THEN 1 ELSE 0 END - CASE WHEN OLD.status='confirmed' THEN 1 ELSE 0 END,
      updated_at          = NOW()
    WHERE memorial_id = NEW.memorial_id;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    UPDATE public.ceremony_stats SET
      total_donations     = total_donations     - 1,
      pending_donations   = pending_donations   - CASE WHEN OLD.status='pending'   THEN 1 ELSE 0 END,
      confirmed_donations = confirmed_donations - CASE WHEN OLD.status='confirmed' THEN 1 ELSE 0 END,
      rejected_donations  = rejected_donations  - CASE WHEN OLD.status='rejected'  THEN 1 ELSE 0 END,
      total_amount        = total_amount        - CASE WHEN OLD.status='confirmed' THEN OLD.amount ELSE 0 END,
      wreaths_reduced     = wreaths_reduced     - CASE WHEN OLD.status='confirmed' THEN 1 ELSE 0 END,
      updated_at          = NOW()
    WHERE memorial_id = OLD.memorial_id;
    RETURN OLD;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_donations_ceremony_stats ON public.donations;
CREATE TRIGGER trg_donations_ceremony_stats
  AFTER INSERT OR UPDATE OF status OR DELETE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_ceremony_stats();

-- tenant_stats (memorial counts)
CREATE OR REPLACE FUNCTION public.fn_update_tenant_memorial_counts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.center_id IS NOT NULL THEN
    INSERT INTO public.tenant_stats (center_id, total_memorials, active_memorials, closed_memorials)
    VALUES (NEW.center_id, 1,
      CASE WHEN NEW.funeral_status='active' THEN 1 ELSE 0 END,
      CASE WHEN NEW.funeral_status='closed' THEN 1 ELSE 0 END
    )
    ON CONFLICT (center_id) DO UPDATE SET
      total_memorials  = tenant_stats.total_memorials  + 1,
      active_memorials = tenant_stats.active_memorials + CASE WHEN NEW.funeral_status='active' THEN 1 ELSE 0 END,
      closed_memorials = tenant_stats.closed_memorials + CASE WHEN NEW.funeral_status='closed' THEN 1 ELSE 0 END,
      updated_at       = NOW();
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.funeral_status <> NEW.funeral_status AND NEW.center_id IS NOT NULL THEN
    UPDATE public.tenant_stats SET
      active_memorials = active_memorials + CASE WHEN NEW.funeral_status='active' THEN 1 ELSE 0 END - CASE WHEN OLD.funeral_status='active' THEN 1 ELSE 0 END,
      closed_memorials = closed_memorials + CASE WHEN NEW.funeral_status='closed' THEN 1 ELSE 0 END - CASE WHEN OLD.funeral_status='closed' THEN 1 ELSE 0 END,
      updated_at       = NOW()
    WHERE center_id = NEW.center_id;
    RETURN NEW;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_memorials_tenant_stats ON public.memorials;
CREATE TRIGGER trg_memorials_tenant_stats
  AFTER INSERT OR UPDATE OF funeral_status ON public.memorials
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_tenant_memorial_counts();

-- tenant_stats (donation totals)
CREATE OR REPLACE FUNCTION public.fn_update_tenant_donation_stats()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_center_id UUID;
BEGIN
  SELECT center_id INTO v_center_id FROM public.memorials WHERE id = COALESCE(NEW.memorial_id, OLD.memorial_id);
  IF v_center_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.tenant_stats (center_id, total_donations, confirmed_donations, total_amount, wreaths_reduced)
    VALUES (v_center_id, 1,
      CASE WHEN NEW.status='confirmed' THEN 1 ELSE 0 END,
      CASE WHEN NEW.status='confirmed' THEN NEW.amount ELSE 0 END,
      CASE WHEN NEW.status='confirmed' THEN 1 ELSE 0 END
    )
    ON CONFLICT (center_id) DO UPDATE SET
      total_donations     = tenant_stats.total_donations     + 1,
      confirmed_donations = tenant_stats.confirmed_donations + CASE WHEN NEW.status='confirmed' THEN 1 ELSE 0 END,
      total_amount        = tenant_stats.total_amount        + CASE WHEN NEW.status='confirmed' THEN NEW.amount ELSE 0 END,
      wreaths_reduced     = tenant_stats.wreaths_reduced     + CASE WHEN NEW.status='confirmed' THEN 1 ELSE 0 END,
      updated_at          = NOW();
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status <> NEW.status THEN
    UPDATE public.tenant_stats SET
      confirmed_donations = confirmed_donations + CASE WHEN NEW.status='confirmed' THEN 1 ELSE 0 END - CASE WHEN OLD.status='confirmed' THEN 1 ELSE 0 END,
      total_amount        = total_amount        + CASE WHEN NEW.status='confirmed' THEN NEW.amount ELSE 0 END - CASE WHEN OLD.status='confirmed' THEN OLD.amount ELSE 0 END,
      wreaths_reduced     = wreaths_reduced     + CASE WHEN NEW.status='confirmed' THEN 1 ELSE 0 END - CASE WHEN OLD.status='confirmed' THEN 1 ELSE 0 END,
      updated_at          = NOW()
    WHERE center_id = v_center_id;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    UPDATE public.tenant_stats SET
      total_donations     = total_donations     - 1,
      confirmed_donations = confirmed_donations - CASE WHEN OLD.status='confirmed' THEN 1 ELSE 0 END,
      total_amount        = total_amount        - CASE WHEN OLD.status='confirmed' THEN OLD.amount ELSE 0 END,
      wreaths_reduced     = wreaths_reduced     - CASE WHEN OLD.status='confirmed' THEN 1 ELSE 0 END,
      updated_at          = NOW()
    WHERE center_id = v_center_id;
    RETURN OLD;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_donations_tenant_stats ON public.donations;
CREATE TRIGGER trg_donations_tenant_stats
  AFTER INSERT OR UPDATE OF status OR DELETE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_tenant_donation_stats();

-- claim_outbox_jobs
CREATE OR REPLACE FUNCTION public.claim_outbox_jobs(p_batch_size INT DEFAULT 10)
RETURNS SETOF public.outbox_jobs LANGUAGE sql AS $$
  UPDATE public.outbox_jobs
  SET status = 'processing', claimed_at = NOW(), attempts = attempts + 1
  WHERE id IN (
    SELECT id FROM public.outbox_jobs
    WHERE status = 'pending' AND scheduled_at <= NOW() AND attempts < max_attempts
    ORDER BY scheduled_at
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
$$;

-- confirm_donation (atomic: insert payment + confirm + enqueue print)
CREATE OR REPLACE FUNCTION public.confirm_donation(
  p_donation_id  UUID,
  p_provider     TEXT,
  p_provider_ref TEXT,
  p_amount       NUMERIC,
  p_metadata     JSONB DEFAULT NULL,
  p_slip_hash    TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_row_count   INT;
  v_memorial_id UUID;
BEGIN
  INSERT INTO public.payments (donation_id, provider, provider_ref, amount, metadata)
  VALUES (p_donation_id, p_provider, p_provider_ref, p_amount, p_metadata)
  ON CONFLICT (provider, provider_ref) DO NOTHING;
  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  IF v_row_count = 0 THEN RETURN jsonb_build_object('ok', false, 'reason', 'duplicate'); END IF;

  UPDATE public.donations
  SET status = 'confirmed', confirmed_at = NOW(), reviewed_at = NOW(),
      slip_hash = COALESCE(slip_hash, p_slip_hash)
  WHERE id = p_donation_id
  RETURNING memorial_id INTO v_memorial_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'donation not found: %', p_donation_id; END IF;

  INSERT INTO public.outbox_jobs (job_type, payload, dedupe_key)
  VALUES ('print_nameplate',
    jsonb_build_object('donation_id', p_donation_id, 'memorial_id', v_memorial_id),
    'print:' || p_donation_id::TEXT)
  ON CONFLICT (dedupe_key) DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'memorial_id', v_memorial_id);
END;
$$;

-- ================================================================
-- 18. VIEW — center_report_totals
-- ================================================================
CREATE OR REPLACE VIEW public.center_report_totals AS
SELECT
  c.id                                                        AS center_id,
  c.name                                                      AS center_name,
  c.province,
  c.amphoe,
  c.status                                                    AS center_status,
  COALESCE(SUM(s.donation_count), 0)::INT                    AS donation_count,
  COALESCE(SUM(s.pending_count),  0)::INT                    AS pending_count,
  COALESCE(SUM(s.confirmed_count),0)::INT                    AS confirmed_count,
  COALESCE(SUM(s.rejected_count), 0)::INT                    AS rejected_count,
  COALESCE(SUM(s.total_amount),   0)::NUMERIC(14,2)          AS total_amount,
  COALESCE(SUM(s.wreaths_reduced),0)::INT                    AS wreaths_reduced,
  COALESCE(SUM(s.waste_reduced_kg),0)::NUMERIC(12,2)         AS waste_reduced_kg,
  MAX(s.updated_at)                                           AS updated_at
FROM public.centers c
LEFT JOIN public.center_daily_stats s ON s.center_id = c.id
GROUP BY c.id, c.name, c.province, c.amphoe, c.status;

-- ================================================================
-- 19. STORAGE BUCKETS
-- ================================================================
-- memorials: public (photos, QR images, nameplate PNGs)
INSERT INTO storage.buckets (id, name, public)
  VALUES ('memorials', 'memorials', TRUE)
  ON CONFLICT (id) DO UPDATE SET public = TRUE;

-- donations: private (slip evidence — served via signed URL)
INSERT INTO storage.buckets (id, name, public)
  VALUES ('donations', 'donations', FALSE)
  ON CONFLICT (id) DO UPDATE SET public = FALSE;

-- ================================================================
-- 20. STORAGE POLICIES
-- ================================================================
-- All uploads go through Next.js API routes (service role = bypass RLS)
-- Only explicit policies needed: public read for memorials bucket

DROP POLICY IF EXISTS "Public read memorials"  ON storage.objects;
DROP POLICY IF EXISTS "Service upload memorials" ON storage.objects;

CREATE POLICY "Public read memorials"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'memorials');

CREATE POLICY "Service upload memorials"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'memorials');

-- donations bucket: no public policies — service role handles all access

-- ================================================================
-- 21. AI_PHOTO_TEMPLATES seed data
-- ================================================================
INSERT INTO public.ai_photo_templates (template_name, template_key, description, prompt_template, negative_prompt, required_inputs, sort_order)
VALUES
(
  'ยืนถือป้ายหรีดร่วมบุญ', 'standing_with_label',
  'ภาพหลักสำหรับผู้มอบ ยืนถือป้ายแนวยาวในงานศพไทย',
  'สร้างภาพถ่ายสมจริงในงานศพไทยที่สุภาพ หรู เรียบ โทนครีม เบจ ทอง
ใช้บุคคลจากรูปที่แนบเป็นผู้มอบหลัก ให้หน้าตาใกล้เคียงรูปอ้างอิงอย่างสุภาพ
ผู้มอบยืนตรง ถือป้ายหรีดร่วมบุญแนวยาวสองมือ ขนาดเท่าป้ายพวงหรีดจริง ไม่ใหญ่เกินจริง
บนป้ายเขียนข้อความไทยให้ชัดเจน:
[wreath_label_text]
ฉากหลังเป็นบอร์ดหรีดร่วมบุญดอกไม้แห้ง ใช้ซ้ำได้ มีบรรยากาศศาลางานศพไทย
งานจัดที่ [funeral_place] เพื่อรำลึกถึง [deceased_name]
สีหน้าผู้มอบสงบ อาลัย สุภาพ ไม่ยิ้ม',
  'ห้ามทำเป็นการ์ตูน, ห้ามสีสดจัด, ห้ามป้ายใหญ่เกินจริง, ห้ามท่าทางร่าเริง, ห้ามเพิ่มคนจำนวนมาก, ห้ามโลโก้ปลอม, ห้ามข้อความมั่วหรือภาษาเพี้ยน',
  '["donor_photo","donor_name","donor_position","condolence_text","funeral_place"]'::JSONB, 1
),
(
  'ไหว้อาลัยหน้าบอร์ด', 'mourning_wai',
  'ภาพสุภาพ ผู้มอบไหว้อาลัยหน้าบอร์ดหรีดร่วมบุญ',
  'สร้างภาพถ่ายสมจริงในงานศพไทยที่สงบ เรียบหรู สมเกียรติ โทนครีม เบจ ทอง
ใช้บุคคลจากรูปที่แนบเป็นผู้มอบหลัก ให้ผู้มอบยืนไหว้อาลัยหน้าบอร์ดหรีดร่วมบุญ
มีป้ายชื่อผู้มอบติดอยู่บนบอร์ดด้านหลังอย่างสุภาพ ข้อความบนป้าย:
[wreath_label_text]
บรรยากาศเป็นศาลางานศพไทย มีดอกไม้แห้งสีขาวและทองอย่างพอดี
งานจัดที่ [funeral_place] เพื่อรำลึกถึง [deceased_name]
สีหน้าผู้มอบสงบ อาลัย ไม่ยิ้ม ไม่มองกล้องมากเกินไป',
  'ห้ามทำเป็นการ์ตูน, ห้ามสีสดจัด, ห้ามท่าทางร่าเริง, ห้ามบอร์ดรก, ห้ามเพิ่มคนจำนวนมาก, ห้ามข้อความมั่วหรือภาษาเพี้ยน',
  '["donor_photo","donor_name","donor_position","condolence_text","funeral_place"]'::JSONB, 2
),
(
  'เจ้าภาพรับมอบ', 'host_receiving',
  'ภาพจำลองการมอบป้ายระหว่างผู้มอบและเจ้าภาพ',
  'สร้างภาพถ่ายสมจริงในงานศพไทยที่สุภาพ หรู เรียบ สมเกียรติ โทนครีม เบจ ทอง
ใช้บุคคลจากรูปที่แนบเป็นผู้มอบหลัก ให้ผู้มอบยืนมอบป้ายหรีดร่วมบุญให้เจ้าภาพหนึ่งคน
เจ้าภาพรับป้ายด้วยท่าทางสุภาพ สงบ และขอบคุณ
ป้ายเป็นแนวยาว ขนาดเท่าป้ายพวงหรีดเดิม ไม่ใหญ่เกินจริง ข้อความบนป้าย:
[wreath_label_text]
ฉากหลังเป็นศาลางานศพไทยและบอร์ดหรีดร่วมบุญดอกไม้แห้ง
งานจัดที่ [funeral_place] เพื่อรำลึกถึง [deceased_name]
ทุกคนมีสีหน้าสงบ อาลัย ไม่ยิ้มกว้าง',
  'ห้ามทำเป็นการ์ตูน, ห้ามสีสดจัด, ห้ามป้ายใหญ่เกินจริง, ห้ามท่าทางรื่นเริง, ห้ามเพิ่มฝูงชน, ห้ามข้อความมั่วหรือภาษาเพี้ยน',
  '["donor_photo","donor_name","donor_position","condolence_text","funeral_place"]'::JSONB, 3
)
ON CONFLICT (template_key) DO UPDATE SET
  template_name   = EXCLUDED.template_name,
  description     = EXCLUDED.description,
  prompt_template = EXCLUDED.prompt_template,
  negative_prompt = EXCLUDED.negative_prompt,
  required_inputs = EXCLUDED.required_inputs,
  sort_order      = EXCLUDED.sort_order,
  is_active       = TRUE;

-- ================================================================
-- DONE
-- ================================================================
-- หลังรัน SQL นี้แล้ว ตรวจสอบ:
--   Table Editor → ควรเห็น 20+ tables
--   Storage → ควรเห็น 2 buckets: memorials (Public), donations (Private)
-- ================================================================
