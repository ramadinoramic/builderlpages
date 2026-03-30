-- HTML templates storage: stores uploaded HTML/CSS designs
CREATE TABLE html_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  -- The raw HTML content (with data-editable markers)
  html_content TEXT NOT NULL,
  -- Optional separate CSS
  css_content TEXT,
  -- Thumbnail screenshot (base64 or URL)
  thumbnail_url TEXT,
  -- Auto-detected or manually defined editable regions
  -- [{id, selector, type: "text"|"image"|"link"|"color"|"html", label, defaultValue}]
  editable_regions JSONB DEFAULT '[]',
  category TEXT DEFAULT 'casino' CHECK (category IN ('casino', 'sports', 'both')),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Link html_templates to the templates table so they appear in campaign creation
-- We'll use template id = 'html-{uuid}' pattern

ALTER TABLE html_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view html templates" ON html_templates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert html templates" ON html_templates
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update html templates" ON html_templates
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can delete html templates" ON html_templates
  FOR DELETE TO authenticated USING (true);
