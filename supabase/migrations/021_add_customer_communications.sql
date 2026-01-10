-- Customer communications table for tracking customer interactions
CREATE TABLE IF NOT EXISTS customer_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  communication_type TEXT NOT NULL CHECK (communication_type IN ('email', 'phone', 'meeting', 'sms')),
  subject TEXT,
  notes TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  communication_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_communications_company_id ON customer_communications(company_id);
CREATE INDEX IF NOT EXISTS idx_customer_communications_employee_id ON customer_communications(employee_id);
CREATE INDEX IF NOT EXISTS idx_customer_communications_customer_email ON customer_communications(customer_email);
CREATE INDEX IF NOT EXISTS idx_customer_communications_customer_phone ON customer_communications(customer_phone);
CREATE INDEX IF NOT EXISTS idx_customer_communications_type ON customer_communications(communication_type);
CREATE INDEX IF NOT EXISTS idx_customer_communications_date ON customer_communications(communication_date);

-- Enable RLS
ALTER TABLE customer_communications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Companies can view all communications for their employees
CREATE POLICY "Companies can view all employee communications"
  ON customer_communications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = customer_communications.employee_id
      AND employees.company_id = auth.uid()
    )
  );

-- RLS Policy: Companies can insert communications
CREATE POLICY "Companies can insert communications"
  ON customer_communications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = customer_communications.employee_id
      AND employees.company_id = auth.uid()
    )
  );

-- RLS Policy: Companies can update communications
CREATE POLICY "Companies can update communications"
  ON customer_communications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = customer_communications.employee_id
      AND employees.company_id = auth.uid()
    )
  );

-- RLS Policy: Companies can delete communications
CREATE POLICY "Companies can delete communications"
  ON customer_communications FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = customer_communications.employee_id
      AND employees.company_id = auth.uid()
    )
  );

-- RLS Policy: Employees can view their own communications
CREATE POLICY "Employees can view their own communications"
  ON customer_communications FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE id = customer_communications.employee_id
    )
  );

-- RLS Policy: Employees can insert their own communications
CREATE POLICY "Employees can insert their own communications"
  ON customer_communications FOR INSERT
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees
      WHERE id = customer_communications.employee_id
    )
  );

-- RLS Policy: Employees can update their own communications
CREATE POLICY "Employees can update their own communications"
  ON customer_communications FOR UPDATE
  USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE id = customer_communications.employee_id
    )
  );

COMMENT ON TABLE customer_communications IS 'Müşteri iletişim geçmişi tablosu';
COMMENT ON COLUMN customer_communications.communication_type IS 'İletişim tipi: email, phone, meeting, sms';
COMMENT ON COLUMN customer_communications.attachments IS 'Ek dosyalar (JSON array)';



