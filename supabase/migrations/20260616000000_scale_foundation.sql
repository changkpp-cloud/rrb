-- =============================================================
-- Scale Foundation: Outbox, Idempotency, Stats
-- =============================================================

-- ── 1. payments (idempotency for webhook dedup) ──────────────
CREATE TABLE IF NOT EXISTS payments (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id    uuid        NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  provider       text        NOT NULL,
  provider_ref   text        NOT NULL,
  amount         numeric     NOT NULL,
  status         text        NOT NULL DEFAULT 'completed',
  metadata       jsonb,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payments_provider_ref_unique UNIQUE (provider, provider_ref)
);

CREATE INDEX IF NOT EXISTS payments_donation_id_idx ON payments (donation_id);

-- ── 2. outbox_jobs (transactional outbox) ────────────────────
CREATE TABLE IF NOT EXISTS outbox_jobs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type     text        NOT NULL,
  payload      jsonb       NOT NULL DEFAULT '{}',
  status       text        NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','processing','completed','failed')),
  dedupe_key   text        UNIQUE,           -- NULL = no dedup
  attempts     int         NOT NULL DEFAULT 0,
  max_attempts int         NOT NULL DEFAULT 3,
  last_error   text,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  claimed_at   timestamptz,
  completed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS outbox_jobs_claimable_idx
  ON outbox_jobs (scheduled_at)
  WHERE status = 'pending';

-- ── 3. ceremony_stats (per-memorial summary) ─────────────────
CREATE TABLE IF NOT EXISTS ceremony_stats (
  memorial_id          uuid        PRIMARY KEY REFERENCES memorials(id) ON DELETE CASCADE,
  total_donations      int         NOT NULL DEFAULT 0,
  confirmed_donations  int         NOT NULL DEFAULT 0,
  pending_donations    int         NOT NULL DEFAULT 0,
  rejected_donations   int         NOT NULL DEFAULT 0,
  total_amount         numeric     NOT NULL DEFAULT 0,
  wreaths_reduced      int         NOT NULL DEFAULT 0,
  last_donation_at     timestamptz,
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- ── 4. tenant_stats (per-center summary) ─────────────────────
CREATE TABLE IF NOT EXISTS tenant_stats (
  center_id            uuid        PRIMARY KEY REFERENCES centers(id) ON DELETE CASCADE,
  total_memorials      int         NOT NULL DEFAULT 0,
  active_memorials     int         NOT NULL DEFAULT 0,
  closed_memorials     int         NOT NULL DEFAULT 0,
  total_donations      int         NOT NULL DEFAULT 0,
  confirmed_donations  int         NOT NULL DEFAULT 0,
  total_amount         numeric     NOT NULL DEFAULT 0,
  wreaths_reduced      int         NOT NULL DEFAULT 0,
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- ── 5. Trigger: ceremony_stats ← donations ───────────────────
CREATE OR REPLACE FUNCTION fn_update_ceremony_stats()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO ceremony_stats (
      memorial_id, total_donations,
      pending_donations, confirmed_donations, rejected_donations,
      total_amount, wreaths_reduced, last_donation_at
    ) VALUES (
      NEW.memorial_id, 1,
      CASE WHEN NEW.status = 'pending'   THEN 1 ELSE 0 END,
      CASE WHEN NEW.status = 'confirmed' THEN 1 ELSE 0 END,
      CASE WHEN NEW.status = 'rejected'  THEN 1 ELSE 0 END,
      CASE WHEN NEW.status = 'confirmed' THEN NEW.amount ELSE 0 END,
      CASE WHEN NEW.status = 'confirmed' THEN 1 ELSE 0 END,
      now()
    )
    ON CONFLICT (memorial_id) DO UPDATE SET
      total_donations     = ceremony_stats.total_donations     + 1,
      pending_donations   = ceremony_stats.pending_donations   + CASE WHEN NEW.status = 'pending'   THEN 1 ELSE 0 END,
      confirmed_donations = ceremony_stats.confirmed_donations + CASE WHEN NEW.status = 'confirmed' THEN 1 ELSE 0 END,
      rejected_donations  = ceremony_stats.rejected_donations  + CASE WHEN NEW.status = 'rejected'  THEN 1 ELSE 0 END,
      total_amount        = ceremony_stats.total_amount        + CASE WHEN NEW.status = 'confirmed' THEN NEW.amount ELSE 0 END,
      wreaths_reduced     = ceremony_stats.wreaths_reduced     + CASE WHEN NEW.status = 'confirmed' THEN 1 ELSE 0 END,
      last_donation_at    = now(),
      updated_at          = now();
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status <> NEW.status THEN
    UPDATE ceremony_stats SET
      pending_donations   = pending_donations
        + CASE WHEN NEW.status = 'pending'   THEN 1 ELSE 0 END
        - CASE WHEN OLD.status = 'pending'   THEN 1 ELSE 0 END,
      confirmed_donations = confirmed_donations
        + CASE WHEN NEW.status = 'confirmed' THEN 1 ELSE 0 END
        - CASE WHEN OLD.status = 'confirmed' THEN 1 ELSE 0 END,
      rejected_donations  = rejected_donations
        + CASE WHEN NEW.status = 'rejected'  THEN 1 ELSE 0 END
        - CASE WHEN OLD.status = 'rejected'  THEN 1 ELSE 0 END,
      total_amount        = total_amount
        + CASE WHEN NEW.status = 'confirmed' THEN  NEW.amount ELSE 0 END
        - CASE WHEN OLD.status = 'confirmed' THEN  OLD.amount ELSE 0 END,
      wreaths_reduced     = wreaths_reduced
        + CASE WHEN NEW.status = 'confirmed' THEN 1 ELSE 0 END
        - CASE WHEN OLD.status = 'confirmed' THEN 1 ELSE 0 END,
      updated_at          = now()
    WHERE memorial_id = NEW.memorial_id;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    UPDATE ceremony_stats SET
      total_donations     = total_donations     - 1,
      pending_donations   = pending_donations   - CASE WHEN OLD.status = 'pending'   THEN 1 ELSE 0 END,
      confirmed_donations = confirmed_donations - CASE WHEN OLD.status = 'confirmed' THEN 1 ELSE 0 END,
      rejected_donations  = rejected_donations  - CASE WHEN OLD.status = 'rejected'  THEN 1 ELSE 0 END,
      total_amount        = total_amount        - CASE WHEN OLD.status = 'confirmed' THEN OLD.amount ELSE 0 END,
      wreaths_reduced     = wreaths_reduced     - CASE WHEN OLD.status = 'confirmed' THEN 1 ELSE 0 END,
      updated_at          = now()
    WHERE memorial_id = OLD.memorial_id;
    RETURN OLD;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_donations_ceremony_stats ON donations;
CREATE TRIGGER trg_donations_ceremony_stats
  AFTER INSERT OR UPDATE OF status OR DELETE ON donations
  FOR EACH ROW EXECUTE FUNCTION fn_update_ceremony_stats();

-- ── 6. Trigger: tenant_stats ← memorials (memorial counts) ──
CREATE OR REPLACE FUNCTION fn_update_tenant_memorial_counts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.center_id IS NOT NULL THEN
    INSERT INTO tenant_stats (center_id, total_memorials, active_memorials, closed_memorials)
    VALUES (
      NEW.center_id, 1,
      CASE WHEN NEW.funeral_status = 'active' THEN 1 ELSE 0 END,
      CASE WHEN NEW.funeral_status = 'closed' THEN 1 ELSE 0 END
    )
    ON CONFLICT (center_id) DO UPDATE SET
      total_memorials  = tenant_stats.total_memorials  + 1,
      active_memorials = tenant_stats.active_memorials + CASE WHEN NEW.funeral_status = 'active' THEN 1 ELSE 0 END,
      closed_memorials = tenant_stats.closed_memorials + CASE WHEN NEW.funeral_status = 'closed' THEN 1 ELSE 0 END,
      updated_at       = now();
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.funeral_status <> NEW.funeral_status AND NEW.center_id IS NOT NULL THEN
    UPDATE tenant_stats SET
      active_memorials = active_memorials
        + CASE WHEN NEW.funeral_status = 'active' THEN 1 ELSE 0 END
        - CASE WHEN OLD.funeral_status = 'active' THEN 1 ELSE 0 END,
      closed_memorials = closed_memorials
        + CASE WHEN NEW.funeral_status = 'closed' THEN 1 ELSE 0 END
        - CASE WHEN OLD.funeral_status = 'closed' THEN 1 ELSE 0 END,
      updated_at       = now()
    WHERE center_id = NEW.center_id;
    RETURN NEW;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_memorials_tenant_stats ON memorials;
CREATE TRIGGER trg_memorials_tenant_stats
  AFTER INSERT OR UPDATE OF funeral_status ON memorials
  FOR EACH ROW EXECUTE FUNCTION fn_update_tenant_memorial_counts();

-- ── 7. Trigger: tenant_stats ← donations (donation totals) ───
CREATE OR REPLACE FUNCTION fn_update_tenant_donation_stats()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_center_id uuid;
BEGIN
  v_center_id := COALESCE(NEW.center_id, OLD.center_id);
  IF v_center_id IS NULL THEN
    SELECT center_id INTO v_center_id
      FROM memorials WHERE id = COALESCE(NEW.memorial_id, OLD.memorial_id);
  END IF;
  IF v_center_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO tenant_stats (center_id, total_donations, confirmed_donations, total_amount, wreaths_reduced)
    VALUES (
      v_center_id, 1,
      CASE WHEN NEW.status = 'confirmed' THEN 1 ELSE 0 END,
      CASE WHEN NEW.status = 'confirmed' THEN NEW.amount ELSE 0 END,
      CASE WHEN NEW.status = 'confirmed' THEN 1 ELSE 0 END
    )
    ON CONFLICT (center_id) DO UPDATE SET
      total_donations     = tenant_stats.total_donations     + 1,
      confirmed_donations = tenant_stats.confirmed_donations + CASE WHEN NEW.status = 'confirmed' THEN 1 ELSE 0 END,
      total_amount        = tenant_stats.total_amount        + CASE WHEN NEW.status = 'confirmed' THEN NEW.amount ELSE 0 END,
      wreaths_reduced     = tenant_stats.wreaths_reduced     + CASE WHEN NEW.status = 'confirmed' THEN 1 ELSE 0 END,
      updated_at          = now();
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status <> NEW.status THEN
    UPDATE tenant_stats SET
      confirmed_donations = confirmed_donations
        + CASE WHEN NEW.status = 'confirmed' THEN 1 ELSE 0 END
        - CASE WHEN OLD.status = 'confirmed' THEN 1 ELSE 0 END,
      total_amount        = total_amount
        + CASE WHEN NEW.status = 'confirmed' THEN  NEW.amount ELSE 0 END
        - CASE WHEN OLD.status = 'confirmed' THEN  OLD.amount ELSE 0 END,
      wreaths_reduced     = wreaths_reduced
        + CASE WHEN NEW.status = 'confirmed' THEN 1 ELSE 0 END
        - CASE WHEN OLD.status = 'confirmed' THEN 1 ELSE 0 END,
      updated_at          = now()
    WHERE center_id = v_center_id;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    UPDATE tenant_stats SET
      total_donations     = total_donations     - 1,
      confirmed_donations = confirmed_donations - CASE WHEN OLD.status = 'confirmed' THEN 1 ELSE 0 END,
      total_amount        = total_amount        - CASE WHEN OLD.status = 'confirmed' THEN OLD.amount ELSE 0 END,
      wreaths_reduced     = wreaths_reduced     - CASE WHEN OLD.status = 'confirmed' THEN 1 ELSE 0 END,
      updated_at          = now()
    WHERE center_id = v_center_id;
    RETURN OLD;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_donations_tenant_stats ON donations;
CREATE TRIGGER trg_donations_tenant_stats
  AFTER INSERT OR UPDATE OF status OR DELETE ON donations
  FOR EACH ROW EXECUTE FUNCTION fn_update_tenant_donation_stats();

-- ── 8. claim_outbox_jobs (FOR UPDATE SKIP LOCKED) ────────────
CREATE OR REPLACE FUNCTION claim_outbox_jobs(p_batch_size int DEFAULT 10)
RETURNS SETOF outbox_jobs LANGUAGE sql AS $$
  UPDATE outbox_jobs
  SET
    status     = 'processing',
    claimed_at = now(),
    attempts   = attempts + 1
  WHERE id IN (
    SELECT id FROM outbox_jobs
    WHERE  status       = 'pending'
      AND  scheduled_at <= now()
      AND  attempts      < max_attempts
    ORDER BY scheduled_at
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
$$;

-- ── 9. confirm_donation (atomic confirm + enqueue print) ──────
CREATE OR REPLACE FUNCTION confirm_donation(
  p_donation_id  uuid,
  p_provider     text,
  p_provider_ref text,
  p_amount       numeric,
  p_metadata     jsonb DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  v_row_count  int;
  v_memorial_id uuid;
BEGIN
  -- Insert payment (idempotent via UNIQUE constraint)
  INSERT INTO payments (donation_id, provider, provider_ref, amount, metadata)
  VALUES (p_donation_id, p_provider, p_provider_ref, p_amount, p_metadata)
  ON CONFLICT (provider, provider_ref) DO NOTHING;

  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  IF v_row_count = 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'duplicate');
  END IF;

  -- Confirm donation atomically
  UPDATE donations
  SET status       = 'confirmed',
      confirmed_at = now(),
      reviewed_at  = now()
  WHERE id = p_donation_id
  RETURNING memorial_id INTO v_memorial_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'donation not found: %', p_donation_id;
  END IF;

  -- Enqueue nameplate print job (deduplicated)
  INSERT INTO outbox_jobs (job_type, payload, dedupe_key)
  VALUES (
    'print_nameplate',
    jsonb_build_object('donation_id', p_donation_id, 'memorial_id', v_memorial_id),
    'print:' || p_donation_id::text
  )
  ON CONFLICT (dedupe_key) DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'memorial_id', v_memorial_id);
END;
$$;

-- ── 10. Backfill ceremony_stats from existing donations ───────
INSERT INTO ceremony_stats (
  memorial_id, total_donations, confirmed_donations,
  pending_donations, rejected_donations, total_amount, wreaths_reduced
)
SELECT
  memorial_id,
  COUNT(*)                                                        AS total_donations,
  COUNT(*) FILTER (WHERE status = 'confirmed')                   AS confirmed_donations,
  COUNT(*) FILTER (WHERE status = 'pending')                     AS pending_donations,
  COUNT(*) FILTER (WHERE status = 'rejected')                    AS rejected_donations,
  COALESCE(SUM(amount) FILTER (WHERE status = 'confirmed'), 0)   AS total_amount,
  COUNT(*)            FILTER (WHERE status = 'confirmed')        AS wreaths_reduced
FROM donations
GROUP BY memorial_id
ON CONFLICT (memorial_id) DO NOTHING;

-- ── 11. Backfill tenant_stats ────────────────────────────────
INSERT INTO tenant_stats (center_id, total_memorials, active_memorials, closed_memorials)
SELECT
  center_id,
  COUNT(*)                                              AS total_memorials,
  COUNT(*) FILTER (WHERE funeral_status = 'active')    AS active_memorials,
  COUNT(*) FILTER (WHERE funeral_status = 'closed')    AS closed_memorials
FROM memorials
WHERE center_id IS NOT NULL
GROUP BY center_id
ON CONFLICT (center_id) DO UPDATE SET
  total_memorials  = EXCLUDED.total_memorials,
  active_memorials = EXCLUDED.active_memorials,
  closed_memorials = EXCLUDED.closed_memorials,
  updated_at       = now();

WITH ds AS (
  SELECT
    COALESCE(d.center_id, m.center_id)                            AS center_id,
    COUNT(d.id)                                                   AS total_donations,
    COUNT(d.id) FILTER (WHERE d.status = 'confirmed')            AS confirmed_donations,
    COALESCE(SUM(d.amount) FILTER (WHERE d.status = 'confirmed'), 0) AS total_amount,
    COUNT(d.id) FILTER (WHERE d.status = 'confirmed')            AS wreaths_reduced
  FROM donations d
  JOIN memorials m ON m.id = d.memorial_id
  WHERE COALESCE(d.center_id, m.center_id) IS NOT NULL
  GROUP BY COALESCE(d.center_id, m.center_id)
)
INSERT INTO tenant_stats (center_id, total_donations, confirmed_donations, total_amount, wreaths_reduced)
SELECT center_id, total_donations, confirmed_donations, total_amount, wreaths_reduced
FROM ds
ON CONFLICT (center_id) DO UPDATE SET
  total_donations     = EXCLUDED.total_donations,
  confirmed_donations = EXCLUDED.confirmed_donations,
  total_amount        = EXCLUDED.total_amount,
  wreaths_reduced     = EXCLUDED.wreaths_reduced,
  updated_at          = now();
