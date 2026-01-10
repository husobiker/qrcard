-- Tasks table for employee task management
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_company_id ON tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_employee_id ON tasks(employee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Companies can view all tasks for their employees
CREATE POLICY "Companies can view all employee tasks"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = tasks.employee_id
      AND employees.company_id = auth.uid()
    )
  );

-- RLS Policy: Companies can insert tasks for their employees
CREATE POLICY "Companies can insert tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = tasks.employee_id
      AND employees.company_id = auth.uid()
    )
    AND assigned_by = auth.uid()
  );

-- RLS Policy: Companies can update tasks for their employees
CREATE POLICY "Companies can update tasks"
  ON tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = tasks.employee_id
      AND employees.company_id = auth.uid()
    )
  );

-- RLS Policy: Companies can delete tasks for their employees
CREATE POLICY "Companies can delete tasks"
  ON tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = tasks.employee_id
      AND employees.company_id = auth.uid()
    )
  );

-- RLS Policy: Employees can view their own tasks
CREATE POLICY "Employees can view their own tasks"
  ON tasks FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE id = tasks.employee_id
    )
  );

-- RLS Policy: Employees can update their own tasks
CREATE POLICY "Employees can update their own tasks"
  ON tasks FOR UPDATE
  USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE id = tasks.employee_id
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_tasks_updated_at();

COMMENT ON TABLE tasks IS 'Görev yönetimi tablosu';
COMMENT ON COLUMN tasks.status IS 'Görev durumu: pending, in_progress, completed, cancelled';
COMMENT ON COLUMN tasks.priority IS 'Görev önceliği: low, medium, high, urgent';



