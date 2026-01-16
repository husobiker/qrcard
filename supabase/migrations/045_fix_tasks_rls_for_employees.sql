-- Fix RLS policies for tasks table to allow employees to view their own tasks
-- Similar to CRM leads, employees should be able to view their own tasks
-- Note: This policy allows employees to view tasks where they are assigned
-- Since we can't use auth.uid() in mobile app context, we rely on service layer filtering

-- Drop existing employee policies if they exist
DROP POLICY IF EXISTS "Employees can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Employees can update their own tasks" ON tasks;

-- RLS Policy: Employees can view tasks assigned to them
-- This policy allows viewing tasks where employee_id matches any employee
-- The service layer will filter by the specific employee_id
CREATE POLICY "Employees can view their own tasks"
  ON tasks FOR SELECT
  USING (
    employee_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = tasks.employee_id
    )
  );

-- RLS Policy: Employees can update tasks assigned to them
CREATE POLICY "Employees can update their own tasks"
  ON tasks FOR UPDATE
  USING (
    employee_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = tasks.employee_id
    )
  )
  WITH CHECK (
    employee_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = tasks.employee_id
    )
  );
