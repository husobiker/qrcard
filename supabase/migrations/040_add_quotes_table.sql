-- Create quotes table for quote management
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  product_service TEXT,
  description TEXT,
  price DECIMAL(15, 2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 20,
  tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  validity_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  notes TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_company_id ON quotes(company_id);
CREATE INDEX IF NOT EXISTS idx_quotes_employee_id ON quotes(employee_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_validity_date ON quotes(validity_date);

-- Enable RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Employees can view their own quotes" ON quotes;
DROP POLICY IF EXISTS "Employees can create quotes for their company" ON quotes;
DROP POLICY IF EXISTS "Employees can update their own quotes" ON quotes;
DROP POLICY IF EXISTS "Companies can view all quotes for their employees" ON quotes;
DROP POLICY IF EXISTS "Employees can delete their own quotes" ON quotes;

-- RLS Policy: Employees can view their own quotes
CREATE POLICY "Employees can view their own quotes"
  ON quotes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = quotes.employee_id
      AND employees.id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = quotes.company_id
      AND companies.id = auth.uid()
    )
  );

-- RLS Policy: Employees can create quotes for their company
CREATE POLICY "Employees can create quotes for their company"
  ON quotes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = quotes.employee_id
      AND employees.company_id = quotes.company_id
      AND employees.id = auth.uid()
    )
  );

-- RLS Policy: Employees can update their own quotes
CREATE POLICY "Employees can update their own quotes"
  ON quotes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = quotes.employee_id
      AND employees.id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = quotes.company_id
      AND companies.id = auth.uid()
    )
  );

-- RLS Policy: Employees can delete their own quotes
CREATE POLICY "Employees can delete their own quotes"
  ON quotes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = quotes.employee_id
      AND employees.id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = quotes.company_id
      AND companies.id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_quotes_updated_at();
