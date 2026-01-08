-- Transactions table for financial management
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  category TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TRY',
  payment_method TEXT,
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_company_id ON transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_transactions_employee_id ON transactions(employee_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Companies can view all their transactions
CREATE POLICY "Companies can view all their transactions"
  ON transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = transactions.company_id
      AND companies.id = auth.uid()
    )
  );

-- RLS Policy: Companies can insert transactions
CREATE POLICY "Companies can insert transactions"
  ON transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = transactions.company_id
      AND companies.id = auth.uid()
    )
  );

-- RLS Policy: Companies can update their transactions
CREATE POLICY "Companies can update their transactions"
  ON transactions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = transactions.company_id
      AND companies.id = auth.uid()
    )
  );

-- RLS Policy: Companies can delete their transactions
CREATE POLICY "Companies can delete their transactions"
  ON transactions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = transactions.company_id
      AND companies.id = auth.uid()
    )
  );

-- RLS Policy: Employees can view transactions related to them
CREATE POLICY "Employees can view their related transactions"
  ON transactions FOR SELECT
  USING (
    employee_id IS NOT NULL
    AND employee_id IN (
      SELECT id FROM employees
      WHERE id = transactions.employee_id
    )
  );

COMMENT ON TABLE transactions IS 'Finansal işlemler tablosu';
COMMENT ON COLUMN transactions.transaction_type IS 'İşlem tipi: income (gelir), expense (gider)';
COMMENT ON COLUMN transactions.currency IS 'Para birimi (TRY, USD, EUR, vb.)';


