-- Add the custom-builder template
INSERT INTO templates (id, name, description, category, editable_fields, is_active)
VALUES (
  'custom-builder',
  'Custom Builder - Visual Editor',
  'Build your landing page visually with drag-and-drop components. Full control over layout, content, and styling.',
  'both',
  '[{"key":"headline","label":"Headline","type":"text"},{"key":"subheadline","label":"Subheadline","type":"text"},{"key":"cta_text","label":"CTA Text","type":"text"},{"key":"cta_subtext","label":"CTA Subtext","type":"text"},{"key":"cta_color","label":"CTA Color","type":"color"},{"key":"cta_url","label":"CTA URL","type":"url"}]',
  true
)
ON CONFLICT (id) DO NOTHING;
