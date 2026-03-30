-- Fix: Drop FK constraint and NOT NULL on campaigns.template
-- so campaigns can use lander_id instead of templates table
ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_template_fkey;
ALTER TABLE campaigns ALTER COLUMN template DROP NOT NULL;
ALTER TABLE campaigns ALTER COLUMN template SET DEFAULT NULL;

-- Add assets column to landers for storing images as base64
ALTER TABLE landers ADD COLUMN IF NOT EXISTS assets JSONB DEFAULT '{}';
-- assets format: { "filename.png": "data:image/png;base64,...", ... }
