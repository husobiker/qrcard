-- Update RLS policies for customer_communications to allow employees to view and create their own meetings

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Employees can view their own communications" ON customer_communications;
DROP POLICY IF EXISTS "Employees can create their own communications" ON customer_communications;

-- RLS Policy: Employees can view their own customer communications (meetings)
CREATE POLICY "Employees can view their own communications"
  ON customer_communications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = customer_communications.employee_id
      AND employees.id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = customer_communications.company_id
      AND companies.id = auth.uid()
    )
  );

-- RLS Policy: Employees can create their own customer communications (meetings)
CREATE POLICY "Employees can create their own communications"
  ON customer_communications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = customer_communications.employee_id
      AND employees.company_id = customer_communications.company_id
      AND employees.id = auth.uid()
    )
  );
