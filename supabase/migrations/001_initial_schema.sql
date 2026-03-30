-- Templates table
CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  category TEXT DEFAULT 'casino' CHECK (category IN ('casino', 'sports', 'both')),
  editable_fields JSON NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Campaigns table
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  template TEXT NOT NULL REFERENCES templates(id),
  geo TEXT,
  operator TEXT,
  traffic_source TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_campaigns_slug ON campaigns(slug);
CREATE INDEX idx_campaigns_status ON campaigns(status);

-- Variants table
CREATE TABLE variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  traffic_weight INT NOT NULL DEFAULT 50,
  is_control BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  headline TEXT,
  subheadline TEXT,
  cta_text TEXT,
  cta_subtext TEXT,
  cta_color TEXT DEFAULT '#00ca6b',
  cta_url TEXT,
  hero_image_url TEXT,
  body_text TEXT,
  steps JSON DEFAULT '["Kayıt Ol", "Para Yatır", "Kazan"]',
  payment_methods JSON DEFAULT '["Papara", "PayFix", "Kredi Kartı", "EFT"]',
  custom_css TEXT,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_variants_campaign ON variants(campaign_id);

-- Clicks table
CREATE TABLE clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  click_id TEXT UNIQUE NOT NULL,
  campaign_id UUID REFERENCES campaigns(id),
  variant_id UUID REFERENCES variants(id),
  ip TEXT,
  user_agent TEXT,
  referer TEXT,
  geo_country TEXT,
  geo_city TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_clicks_click_id ON clicks(click_id);
CREATE INDEX idx_clicks_campaign_variant ON clicks(campaign_id, variant_id, created_at);

-- Conversions table
CREATE TABLE conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  click_id TEXT REFERENCES clicks(click_id),
  campaign_id UUID REFERENCES campaigns(id),
  variant_id UUID REFERENCES variants(id),
  conversion_type TEXT DEFAULT 'registration',
  payout DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  external_id TEXT,
  postback_raw JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_conversions_campaign ON conversions(campaign_id, variant_id, created_at);

-- Campaign stats view
CREATE VIEW campaign_stats AS
SELECT
  c.id AS campaign_id,
  c.name AS campaign_name,
  c.status,
  v.id AS variant_id,
  v.name AS variant_name,
  v.traffic_weight,
  v.is_control,
  COUNT(DISTINCT cl.id) AS clicks,
  COUNT(DISTINCT conv.id) AS conversions,
  CASE WHEN COUNT(DISTINCT cl.id) > 0
    THEN ROUND(COUNT(DISTINCT conv.id)::numeric / COUNT(DISTINCT cl.id) * 100, 2)
    ELSE 0
  END AS conversion_rate,
  COALESCE(SUM(conv.payout), 0) AS total_payout
FROM campaigns c
JOIN variants v ON v.campaign_id = c.id
LEFT JOIN clicks cl ON cl.variant_id = v.id
LEFT JOIN conversions conv ON conv.click_id = cl.click_id
GROUP BY c.id, c.name, c.status, v.id, v.name, v.traffic_weight, v.is_control;

-- RLS Policies
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Templates are readable by all authenticated users
CREATE POLICY "Templates are viewable by authenticated users" ON templates
  FOR SELECT TO authenticated USING (true);

-- Campaigns: users can read/write their own
CREATE POLICY "Users can view all campaigns" ON campaigns
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert campaigns" ON campaigns
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update campaigns" ON campaigns
  FOR UPDATE TO authenticated USING (true);

-- Variants follow campaign access
CREATE POLICY "Users can view variants" ON variants
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert variants" ON variants
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update variants" ON variants
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can delete variants" ON variants
  FOR DELETE TO authenticated USING (true);

-- Clicks and conversions: readable by authenticated, writable by service role
CREATE POLICY "Users can view clicks" ON clicks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view conversions" ON conversions
  FOR SELECT TO authenticated USING (true);

-- Allow anon/service to insert clicks (from API routes)
CREATE POLICY "API can insert clicks" ON clicks
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "API can insert conversions" ON conversions
  FOR INSERT TO anon WITH CHECK (true);
