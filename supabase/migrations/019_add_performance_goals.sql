-- Performance goals table for tracking employee targets
CREATE TABLE IF NOT EXISTS performance_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('sales', 'leads', 'appointments', 'revenue')),
  target_value DECIMAL(15, 2) NOT NULL,
  current_value DECIMAL(15, 2) DEFAULT 0,
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_performance_goals_company_id ON performance_goals(company_id);
CREATE INDEX IF NOT EXISTS idx_performance_goals_employee_id ON performance_goals(employee_id);
CREATE INDEX IF NOT EXISTS idx_performance_goals_goal_type ON performance_goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_performance_goals_period ON performance_goals(period_start, period_end);

-- Enable RLS
ALTER TABLE performance_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Companies can view all goals for their employees
CREATE POLICY "Companies can view all employee goals"
  ON performance_goals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = performance_goals.employee_id
      AND employees.company_id = auth.uid()
    )
  );

-- RLS Policy: Companies can insert goals for their employees
CREATE POLICY "Companies can insert goals"
  ON performance_goals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = performance_goals.employee_id
      AND employees.company_id = auth.uid()
    )
  );

-- RLS Policy: Companies can update goals for their employees
CREATE POLICY "Companies can update goals"
  ON performance_goals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = performance_goals.employee_id
      AND employees.company_id = auth.uid()
    )
  );

-- RLS Policy: Companies can delete goals for their employees
CREATE POLICY "Companies can delete goals"
  ON performance_goals FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = performance_goals.employee_id
      AND employees.company_id = auth.uid()
    )
  );

-- RLS Policy: Employees can view their own goals
CREATE POLICY "Employees can view their own goals"
  ON performance_goals FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE id = performance_goals.employee_id
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_performance_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_performance_goals_updated_at
  BEFORE UPDATE ON performance_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_performance_goals_updated_at();

COMMENT ON TABLE performance_goals IS 'Performans hedefleri tablosu';
COMMENT ON COLUMN performance_goals.goal_type IS 'Hedef tipi: sales, leads, appointments, revenue';
COMMENT ON COLUMN performance_goals.period_type IS 'Dönem tipi: monthly, yearly';



