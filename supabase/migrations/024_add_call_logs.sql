-- Call logs table for tracking all phone calls
CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  call_type TEXT NOT NULL CHECK (call_type IN ('outgoing', 'incoming', 'missed')),
  phone_number TEXT NOT NULL,
  customer_name TEXT,
  customer_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL,
  call_duration INTEGER DEFAULT 0, -- Duration in seconds
  call_status TEXT NOT NULL DEFAULT 'completed' CHECK (call_status IN ('completed', 'no_answer', 'busy', 'failed')),
  recording_url TEXT,
  notes TEXT,
  call_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  call_end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_call_logs_company_id ON call_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_employee_id ON call_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_customer_id ON call_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_call_type ON call_logs(call_type);
CREATE INDEX IF NOT EXISTS idx_call_logs_call_status ON call_logs(call_status);
CREATE INDEX IF NOT EXISTS idx_call_logs_call_start_time ON call_logs(call_start_time);

-- Enable RLS
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Companies can view all call logs for their employees
CREATE POLICY "Companies can view all employee call logs"
  ON call_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = call_logs.employee_id
      AND employees.company_id = auth.uid()
    )
  );

-- RLS Policy: Companies can insert call logs
CREATE POLICY "Companies can insert call logs"
  ON call_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = call_logs.employee_id
      AND employees.company_id = auth.uid()
    )
  );

-- RLS Policy: Companies can update call logs
CREATE POLICY "Companies can update call logs"
  ON call_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = call_logs.employee_id
      AND employees.company_id = auth.uid()
    )
  );

-- RLS Policy: Companies can delete call logs
CREATE POLICY "Companies can delete call logs"
  ON call_logs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = call_logs.employee_id
      AND employees.company_id = auth.uid()
    )
  );

-- RLS Policy: Employees can view their own call logs
CREATE POLICY "Employees can view their own call logs"
  ON call_logs FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE id = call_logs.employee_id
    )
  );

-- RLS Policy: Employees can insert their own call logs
CREATE POLICY "Employees can insert their own call logs"
  ON call_logs FOR INSERT
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees
      WHERE id = call_logs.employee_id
    )
  );

-- RLS Policy: Employees can update their own call logs
CREATE POLICY "Employees can update their own call logs"
  ON call_logs FOR UPDATE
  USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE id = call_logs.employee_id
    )
  );

COMMENT ON TABLE call_logs IS 'Arama kayıtları tablosu';
COMMENT ON COLUMN call_logs.call_type IS 'Arama tipi: outgoing (giden), incoming (gelen), missed (cevapsız)';
COMMENT ON COLUMN call_logs.call_status IS 'Arama durumu: completed, no_answer, busy, failed';
COMMENT ON COLUMN call_logs.call_duration IS 'Arama süresi (saniye cinsinden)';
COMMENT ON COLUMN call_logs.recording_url IS 'Arama kaydı URL (opsiyonel)';




