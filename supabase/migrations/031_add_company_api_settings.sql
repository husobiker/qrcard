-- Add API settings to companies table for virtual PBX services (like sanalsantral.com)
-- These settings are company-wide, not per employee

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS api_endpoint TEXT,
ADD COLUMN IF NOT EXISTS santral_id TEXT,
ADD COLUMN IF NOT EXISTS api_key TEXT,
ADD COLUMN IF NOT EXISTS api_secret TEXT;

