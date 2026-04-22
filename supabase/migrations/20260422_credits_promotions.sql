-- ══════════════════════════════════════════════════════════════
-- Credits System + Promoted Listings
-- ══════════════════════════════════════════════════════════════

-- ── Credits on broker_profiles ───────────────────────────────
ALTER TABLE broker_profiles ADD COLUMN IF NOT EXISTS credits INT NOT NULL DEFAULT 0;

-- ── Credits on service_providers ─────────────────────────────
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS credits INT NOT NULL DEFAULT 0;

-- ── Promoted listings ────────────────────────────────────────
ALTER TABLE properties ADD COLUMN IF NOT EXISTS promoted_until TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS promoted_by UUID REFERENCES broker_profiles(id);

CREATE INDEX IF NOT EXISTS idx_properties_promoted ON properties(promoted_until)
  WHERE promoted_until IS NOT NULL;

-- ── Credit transactions (audit trail) ────────────────────────
CREATE TABLE IF NOT EXISTS credit_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_type   TEXT NOT NULL,        -- 'broker' | 'servicer'
  user_id     UUID NOT NULL,        -- broker_profiles.id or service_providers.id
  amount      INT NOT NULL,         -- positive = credit, negative = debit
  reason      TEXT NOT NULL,         -- 'signup_bonus' | 'promote_listing' | 'promote_ad' | 'top_placement'
  reference_id UUID,                 -- property_id or ad_id if applicable
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON credit_transactions(user_id);
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own transactions" ON credit_transactions
  FOR SELECT USING (true);
CREATE POLICY "service role manage" ON credit_transactions
  FOR ALL USING (true) WITH CHECK (true);

-- ── Ad impressions tracking ──────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_impressions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  ad_type     TEXT NOT NULL,         -- 'carousel_slide' | 'promoted_listing' | 'search_top'
  advertiser_type TEXT NOT NULL,     -- 'broker' | 'servicer'
  advertiser_id UUID NOT NULL,
  property_id UUID,                  -- which listing showed the ad (for carousel)
  viewed_by   UUID,                  -- user who saw it (if logged in)
  clicked     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_impressions_advertiser ON ad_impressions(advertiser_id);
ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role manage impressions" ON ad_impressions
  FOR ALL USING (true) WITH CHECK (true);

-- ── Give first 100 brokers and 100 service providers signup bonus ──
-- (Run this once, or adjust for your first 5000)
UPDATE broker_profiles SET credits = 100 WHERE credits = 0;
UPDATE service_providers SET credits = 100 WHERE credits = 0;
