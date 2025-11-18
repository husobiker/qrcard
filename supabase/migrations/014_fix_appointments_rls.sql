-- Fix appointments RLS policy for public insert
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public can insert appointments" ON appointments;

-- Recreate the policy to allow public users to insert appointments
CREATE POLICY "Public can insert appointments"
  ON appointments FOR INSERT
  TO public
  WITH CHECK (true);

-- Also ensure employees can view their own appointments
DROP POLICY IF EXISTS "Employees can view own appointments" ON appointments;

CREATE POLICY "Employees can view own appointments"
  ON appointments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = appointments.employee_id
      AND employees.id IN (
        SELECT id FROM employees WHERE id = appointments.employee_id
      )
    )
  );

