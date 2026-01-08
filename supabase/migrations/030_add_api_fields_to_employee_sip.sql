-- Add API endpoint and API key fields to employee_sip_settings
-- These fields are for third-party virtual PBX services (like sanalsantral.com)

ALTER TABLE employee_sip_settings
ADD COLUMN IF NOT EXISTS api_endpoint TEXT,
ADD COLUMN IF NOT EXISTS santral_id TEXT,
ADD COLUMN IF NOT EXISTS api_key TEXT,
ADD COLUMN IF NOT EXISTS api_secret TEXT;

COMMENT ON COLUMN employee_sip_settings.api_endpoint IS 'Sanal santral API endpoint URL (örn: https://api.sanal.link)';
COMMENT ON COLUMN employee_sip_settings.santral_id IS 'Sanal santral ID (örn: 8390)';
COMMENT ON COLUMN employee_sip_settings.api_key IS 'Sanal santral API key';
COMMENT ON COLUMN employee_sip_settings.api_secret IS 'Sanal santral API secret (opsiyonel)';

