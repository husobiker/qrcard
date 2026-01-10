-- Employee SIP settings table for storing SIP credentials
CREATE TABLE IF NOT EXISTS employee_sip_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  sip_username TEXT NOT NULL,
  sip_password TEXT NOT NULL, -- Should be encrypted in production
  extension TEXT,
  sip_server TEXT,
  sip_port INTEGER DEFAULT 5060,
  webrtc_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_sip_settings_company_id ON employee_sip_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_sip_settings_employee_id ON employee_sip_settings(employee_id);

-- Enable RLS
ALTER TABLE employee_sip_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Companies can view all employee SIP settings
CREATE POLICY "Companies can view all employee SIP settings"
  ON employee_sip_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = employee_sip_settings.employee_id
      AND employees.company_id = auth.uid()
    )
  );

-- RLS Policy: Companies can insert employee SIP settings
CREATE POLICY "Companies can insert employee SIP settings"
  ON employee_sip_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = employee_sip_settings.employee_id
      AND employees.company_id = auth.uid()
    )
  );

-- RLS Policy: Companies can update employee SIP settings
CREATE POLICY "Companies can update employee SIP settings"
  ON employee_sip_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = employee_sip_settings.employee_id
      AND employees.company_id = auth.uid()
    )
  );

-- RLS Policy: Companies can delete employee SIP settings
CREATE POLICY "Companies can delete employee SIP settings"
  ON employee_sip_settings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = employee_sip_settings.employee_id
      AND employees.company_id = auth.uid()
    )
  );

-- RLS Policy: Employees can view their own SIP settings
CREATE POLICY "Employees can view their own SIP settings"
  ON employee_sip_settings FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE id = employee_sip_settings.employee_id
    )
  );

-- RLS Policy: Employees can update their own SIP settings
CREATE POLICY "Employees can update their own SIP settings"
  ON employee_sip_settings FOR UPDATE
  USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE id = employee_sip_settings.employee_id
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_employee_sip_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_employee_sip_settings_updated_at
  BEFORE UPDATE ON employee_sip_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_sip_settings_updated_at();

COMMENT ON TABLE employee_sip_settings IS 'Çalışan SIP ayarları tablosu';
COMMENT ON COLUMN employee_sip_settings.sip_password IS 'SIP şifresi (production ortamında şifrelenmiş olmalı)';
COMMENT ON COLUMN employee_sip_settings.extension IS 'SIP extension numarası';
COMMENT ON COLUMN employee_sip_settings.webrtc_enabled IS 'WebRTC desteği aktif mi?';



