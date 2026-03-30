-- Seed templates
INSERT INTO templates (id, name, description, category, editable_fields) VALUES
('casino-v1', 'Casino V1 - Dark Theme', 'Classic dark casino landing page with bonus offer and green CTA', 'casino',
  '[{"key":"headline","label":"Bonus Amount","type":"text"},{"key":"subheadline","label":"Bonus Description","type":"text"},{"key":"cta_text","label":"CTA Button Text","type":"text"},{"key":"cta_subtext","label":"CTA Subtext","type":"text"},{"key":"cta_color","label":"CTA Color","type":"color"},{"key":"cta_url","label":"Operator Link","type":"url"},{"key":"hero_image_url","label":"Hero Image","type":"url"},{"key":"body_text","label":"Body Text","type":"textarea"},{"key":"steps","label":"Steps","type":"list"},{"key":"payment_methods","label":"Payment Methods","type":"list"},{"key":"custom_css","label":"Custom CSS","type":"code"}]'
),
('sports-v1', 'Sports V1 - Betting', 'Sports betting landing page with live odds feel', 'sports',
  '[{"key":"headline","label":"Welcome Offer","type":"text"},{"key":"subheadline","label":"Offer Description","type":"text"},{"key":"cta_text","label":"CTA Button Text","type":"text"},{"key":"cta_subtext","label":"CTA Subtext","type":"text"},{"key":"cta_color","label":"CTA Color","type":"color"},{"key":"cta_url","label":"Operator Link","type":"url"},{"key":"hero_image_url","label":"Hero Image","type":"url"},{"key":"steps","label":"Steps","type":"list"},{"key":"payment_methods","label":"Payment Methods","type":"list"}]'
),
('casino-v2', 'Casino V2 - Modern', 'Modern horizontal casino layout with gradient accents', 'casino',
  '[{"key":"headline","label":"Bonus Amount","type":"text"},{"key":"subheadline","label":"Bonus Description","type":"text"},{"key":"cta_text","label":"CTA Button Text","type":"text"},{"key":"cta_color","label":"CTA Color","type":"color"},{"key":"cta_url","label":"Operator Link","type":"url"},{"key":"hero_image_url","label":"Hero Image","type":"url"},{"key":"steps","label":"Steps","type":"list"},{"key":"payment_methods","label":"Payment Methods","type":"list"}]'
);

-- Seed a sample campaign
INSERT INTO campaigns (id, name, slug, status, template, geo, operator, traffic_source, notes)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Bahigo Casino - Turkey',
  'bahigo-casino-tr',
  'active',
  'casino-v1',
  'TR',
  'Bahigo',
  'propellerads',
  'Main Turkey casino campaign'
);

-- Seed variants
INSERT INTO variants (id, campaign_id, name, traffic_weight, is_control, status, headline, subheadline, cta_text, cta_subtext, cta_color, cta_url, steps, payment_methods)
VALUES
(
  'b1a11111-1111-1111-1111-111111111111',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Control',
  50,
  true,
  'active',
  '₺15.000',
  '%100 HOŞ GELDİN BONUSU',
  'Şimdi Katıl',
  'Sadece 2 dk sürecek',
  '#00ca6b',
  'https://bahigo.com/register?btag=AFFTAG',
  '["Kayıt Ol", "Para Yatır", "Kazan"]',
  '["Papara", "PayFix", "Kredi Kartı", "EFT"]'
),
(
  'b2a22222-2222-2222-2222-222222222222',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Variant B - Higher Bonus',
  50,
  false,
  'active',
  '₺20.000',
  '%150 HOŞ GELDİN BONUSU',
  'Hemen Başla',
  'Kayıt 1 dakika!',
  '#ff6b35',
  'https://bahigo.com/register?btag=AFFTAG',
  '["Üye Ol", "Yatırım Yap", "Kazan"]',
  '["Papara", "PayFix", "Kredi Kartı", "EFT", "Havale"]'
);

-- Seed some fake clicks
INSERT INTO clicks (id, click_id, campaign_id, variant_id, ip, user_agent, geo_country, created_at)
SELECT
  gen_random_uuid(),
  'clk_' || substr(md5(random()::text), 1, 8),
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  CASE WHEN random() > 0.5
    THEN 'b1a11111-1111-1111-1111-111111111111'::uuid
    ELSE 'b2a22222-2222-2222-2222-222222222222'::uuid
  END,
  '185.1.' || floor(random()*255) || '.' || floor(random()*255),
  'Mozilla/5.0',
  'TR',
  now() - (random() * interval '7 days')
FROM generate_series(1, 200);

-- Seed some fake conversions (about 8% CR)
INSERT INTO conversions (id, click_id, campaign_id, variant_id, conversion_type, payout, currency, created_at)
SELECT
  gen_random_uuid(),
  c.click_id,
  c.campaign_id,
  c.variant_id,
  'registration',
  (25 + floor(random() * 50))::numeric,
  'USD',
  c.created_at + interval '5 minutes'
FROM clicks c
WHERE random() < 0.08;
