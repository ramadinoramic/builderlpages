-- Lander Repository: stores complete uploaded landing pages
CREATE TABLE IF NOT EXISTS landers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  -- The complete HTML content (with {{VARIABLE}} placeholders)
  html TEXT NOT NULL,
  -- Detected variables from the HTML e.g. ["CTA_URL","HEADLINE","CTA_TEXT"]
  variables JSONB DEFAULT '[]',
  -- Default values for variables
  defaults JSONB DEFAULT '{}',
  -- Preview thumbnail (base64 data URL or external URL)
  thumbnail TEXT,
  -- Metadata
  notes TEXT,
  is_archived BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_landers_archived ON landers(is_archived);

ALTER TABLE landers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view landers" ON landers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert landers" ON landers
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update landers" ON landers
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete landers" ON landers
  FOR DELETE TO authenticated USING (true);

-- Add lander_id column to campaigns (replaces the template TEXT column)
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS lander_id UUID REFERENCES landers(id);
