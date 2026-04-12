-- ── Broker Verification Flow ──────────────────────────────────────────────────
-- Adds verification_status + document_url to broker_profiles
-- Status: unverified → pending → verified | rejected

ALTER TABLE broker_profiles
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS verification_doc_url  text,
  ADD COLUMN IF NOT EXISTS verification_note     text,
  ADD COLUMN IF NOT EXISTS verification_at       timestamptz;

-- Sync verified flag from status
CREATE OR REPLACE FUNCTION sync_broker_verified()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.verified := (NEW.verification_status = 'verified');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_broker_verified ON broker_profiles;
CREATE TRIGGER trg_sync_broker_verified
  BEFORE INSERT OR UPDATE OF verification_status ON broker_profiles
  FOR EACH ROW EXECUTE FUNCTION sync_broker_verified();

-- Migrate existing: if verified=true → set status to verified
UPDATE broker_profiles SET verification_status = 'verified', verification_at = now() WHERE verified = true;
UPDATE broker_profiles SET verification_status = 'unverified' WHERE verified = false;
