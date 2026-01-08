-- Commission settings table for employee commission configuration
CREATE TABLE IF NOT EXISTS commission_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  commission_type TEXT NOT NULL CHECK (commission_type IN ('percentage', 'fixed')),
  commission_rate DECIMAL(10, 4) NOT NULL,
  min_sales_amount DECIMAL(15, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, employee_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_commission_settings_company_id ON commission_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_commission_settings_employee_id ON commission_settings(employee_id);

-- Enable RLS
ALTER TABLE commission_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Companies can view all commission settings for their employees
CREATE POLICY "Companies can view all employee commission settings"
  ON commission_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = commission_settings.employee_id
      AND employees.company_id = auth.uid()
    )
  );

-- RLS Policy: Companies can insert commission settings
CREATE POLICY "Companies can insert commission settings"
  ON commission_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = commission_settings.employee_id
      AND employees.company_id = auth.uid()
    )
  );

-- RLS Policy: Companies can update commission settings
CREATE POLICY "Companies can update commission settings"
  ON commission_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = commission_settings.employee_id
      AND employees.company_id = auth.uid()
    )
  );

-- RLS Policy: Companies can delete commission settings
CREATE POLICY "Companies can delete commission settings"
  ON commission_settings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = commission_settings.employee_id
      AND employees.company_id = auth.uid()
    )
  );

-- RLS Policy: Employees can view their own commission settings
CREATE POLICY "Employees can view their own commission settings"
  ON commission_settings FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE id = commission_settings.employee_id
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_commission_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_commission_settings_updated_at
  BEFORE UPDATE ON commission_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_commission_settings_updated_at();

COMMENT ON TABLE commission_settings IS 'Komisyon ayarları tablosu';
COMMENT ON COLUMN commission_settings.commission_type IS 'Komisyon tipi: percentage (yüzde), fixed (sabit)';
COMMENT ON COLUMN commission_settings.commission_rate IS 'Komisyon oranı (yüzde için 0-100, sabit için tutar)';
COMMENT ON COLUMN commission_settings.min_sales_amount IS 'Minimum satış tutarı (opsiyonel)';


