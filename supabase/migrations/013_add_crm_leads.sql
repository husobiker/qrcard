-- Create crm_leads table for sales tracking
CREATE TABLE IF NOT EXISTS crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  notes TEXT,
  follow_up_date TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'Yeni' CHECK (status IN ('Yeni', 'Görüşüldü', 'Satış Yapıldı', 'Reddedildi', 'Takipte')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_crm_leads_company_id ON crm_leads(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_employee_id ON crm_leads(employee_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_follow_up_date ON crm_leads(follow_up_date);

-- Enable RLS
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Companies can view all their leads
CREATE POLICY "Companies can view all their leads"
  ON crm_leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = crm_leads.company_id
      AND companies.id = auth.uid()
    )
  );

-- RLS Policy: Companies can insert leads for their company
CREATE POLICY "Companies can insert leads"
  ON crm_leads
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = crm_leads.company_id
      AND companies.id = auth.uid()
    )
  );

-- RLS Policy: Companies can update their leads
CREATE POLICY "Companies can update their leads"
  ON crm_leads
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = crm_leads.company_id
      AND companies.id = auth.uid()
    )
  );

-- RLS Policy: Companies can delete their leads
CREATE POLICY "Companies can delete their leads"
  ON crm_leads
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = crm_leads.company_id
      AND companies.id = auth.uid()
    )
  );

-- RLS Policy: Employees can view only their own leads
CREATE POLICY "Employees can view their own leads"
  ON crm_leads
  FOR SELECT
  USING (
    employee_id IS NOT NULL
    AND employee_id IN (
      SELECT id FROM employees
      WHERE id = crm_leads.employee_id
    )
  );

-- RLS Policy: Employees can insert leads for themselves
CREATE POLICY "Employees can insert their own leads"
  ON crm_leads
  FOR INSERT
  WITH CHECK (
    employee_id IS NOT NULL
    AND employee_id IN (
      SELECT id FROM employees
      WHERE id = crm_leads.employee_id
    )
  );

-- RLS Policy: Employees can update their own leads
CREATE POLICY "Employees can update their own leads"
  ON crm_leads
  FOR UPDATE
  USING (
    employee_id IS NOT NULL
    AND employee_id IN (
      SELECT id FROM employees
      WHERE id = crm_leads.employee_id
    )
  );

-- RLS Policy: Employees can delete their own leads
CREATE POLICY "Employees can delete their own leads"
  ON crm_leads
  FOR DELETE
  USING (
    employee_id IS NOT NULL
    AND employee_id IN (
      SELECT id FROM employees
      WHERE id = crm_leads.employee_id
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_crm_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_crm_leads_updated_at
  BEFORE UPDATE ON crm_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_leads_updated_at();

