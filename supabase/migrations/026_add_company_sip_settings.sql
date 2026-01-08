-- Company SIP settings table for storing company-wide SIP configuration
CREATE TABLE IF NOT EXISTS company_sip_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sip_server TEXT NOT NULL,
  sip_port INTEGER DEFAULT 5060,
  sip_domain TEXT,
  sip_protocol TEXT NOT NULL DEFAULT 'udp' CHECK (sip_protocol IN ('udp', 'tcp', 'tls', 'wss')),
  webrtc_gateway_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_company_sip_settings_company_id ON company_sip_settings(company_id);

-- Enable RLS
ALTER TABLE company_sip_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Companies can view their own SIP settings
CREATE POLICY "Companies can view their own SIP settings"
  ON company_sip_settings FOR SELECT
  USING (company_id = auth.uid());

-- RLS Policy: Companies can insert their own SIP settings
CREATE POLICY "Companies can insert their own SIP settings"
  ON company_sip_settings FOR INSERT
  WITH CHECK (company_id = auth.uid());

-- RLS Policy: Companies can update their own SIP settings
CREATE POLICY "Companies can update their own SIP settings"
  ON company_sip_settings FOR UPDATE
  USING (company_id = auth.uid());

-- RLS Policy: Companies can delete their own SIP settings
CREATE POLICY "Companies can delete their own SIP settings"
  ON company_sip_settings FOR DELETE
  USING (company_id = auth.uid());

-- RLS Policy: Employees can view their company's SIP settings
CREATE POLICY "Employees can view their company SIP settings"
  ON company_sip_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.company_id = company_sip_settings.company_id
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_company_sip_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_sip_settings_updated_at
  BEFORE UPDATE ON company_sip_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_company_sip_settings_updated_at();

COMMENT ON TABLE company_sip_settings IS 'Şirket SIP ayarları tablosu';
COMMENT ON COLUMN company_sip_settings.sip_protocol IS 'SIP protokolü: udp, tcp, tls, wss';
COMMENT ON COLUMN company_sip_settings.webrtc_gateway_url IS 'WebRTC gateway URL (opsiyonel)';

