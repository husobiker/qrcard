-- Fix RLS policies for quotes table to allow employees to create quotes
-- Similar to CRM leads, employees should be able to create quotes without auth.uid() check

-- Drop existing policies
DROP POLICY IF EXISTS "Employees can view their own quotes" ON quotes;
DROP POLICY IF EXISTS "Employees can create quotes for their company" ON quotes;
DROP POLICY IF EXISTS "Employees can update their own quotes" ON quotes;
DROP POLICY IF EXISTS "Employees can delete their own quotes" ON quotes;

-- RLS Policy: Employees can view their own quotes
CREATE POLICY "Employees can view their own quotes"
  ON quotes FOR SELECT
  USING (
    employee_id IS NOT NULL
    AND employee_id IN (
      SELECT id FROM employees
      WHERE id = quotes.employee_id
    )
    OR
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = quotes.company_id
      AND companies.id = auth.uid()
    )
  );

-- RLS Policy: Employees can create quotes for themselves
CREATE POLICY "Employees can create quotes for themselves"
  ON quotes FOR INSERT
  WITH CHECK (
    employee_id IS NOT NULL
    AND employee_id IN (
      SELECT id FROM employees
      WHERE id = quotes.employee_id
      AND company_id = quotes.company_id
    )
    OR
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = quotes.company_id
      AND companies.id = auth.uid()
    )
  );

-- RLS Policy: Employees can update their own quotes
CREATE POLICY "Employees can update their own quotes"
  ON quotes FOR UPDATE
  USING (
    employee_id IS NOT NULL
    AND employee_id IN (
      SELECT id FROM employees
      WHERE id = quotes.employee_id
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
    employee_id IS NOT NULL
    AND employee_id IN (
      SELECT id FROM employees
      WHERE id = quotes.employee_id
    )
    OR
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = quotes.company_id
      AND companies.id = auth.uid()
    )
  );
