-- Commission payments table for tracking commission payments
CREATE TABLE IF NOT EXISTS commission_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  commission_amount DECIMAL(15, 2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_commission_payments_company_id ON commission_payments(company_id);
CREATE INDEX IF NOT EXISTS idx_commission_payments_employee_id ON commission_payments(employee_id);
CREATE INDEX IF NOT EXISTS idx_commission_payments_transaction_id ON commission_payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_commission_payments_status ON commission_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_commission_payments_date ON commission_payments(payment_date);

-- Enable RLS
ALTER TABLE commission_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Companies can view all commission payments for their employees
CREATE POLICY "Companies can view all employee commission payments"
  ON commission_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = commission_payments.employee_id
      AND employees.company_id = auth.uid()
    )
  );

-- RLS Policy: Companies can insert commission payments
CREATE POLICY "Companies can insert commission payments"
  ON commission_payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = commission_payments.employee_id
      AND employees.company_id = auth.uid()
    )
  );

-- RLS Policy: Companies can update commission payments
CREATE POLICY "Companies can update commission payments"
  ON commission_payments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = commission_payments.employee_id
      AND employees.company_id = auth.uid()
    )
  );

-- RLS Policy: Companies can delete commission payments
CREATE POLICY "Companies can delete commission payments"
  ON commission_payments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = commission_payments.employee_id
      AND employees.company_id = auth.uid()
    )
  );

-- RLS Policy: Employees can view their own commission payments
CREATE POLICY "Employees can view their own commission payments"
  ON commission_payments FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE id = commission_payments.employee_id
    )
  );

COMMENT ON TABLE commission_payments IS 'Komisyon ödemeleri tablosu';
COMMENT ON COLUMN commission_payments.payment_status IS 'Ödeme durumu: pending, paid, cancelled';
COMMENT ON COLUMN commission_payments.transaction_id IS 'İlgili işlem (opsiyonel, satış işlemi ile bağlantı)';



