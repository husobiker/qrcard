-- Fix infinite recursion in employees RLS policies
-- This migration drops ALL existing policies and creates simple ones

-- ============================================
-- DROP ALL EXISTING POLICIES FOR EMPLOYEES
-- ============================================
-- Drop all possible policy names
DROP POLICY IF EXISTS "Companies can view own employees" ON employees;
DROP POLICY IF EXISTS "Companies can insert own employees" ON employees;
DROP POLICY IF EXISTS "Companies can update own employees" ON employees;
DROP POLICY IF EXISTS "Companies can delete own employees" ON employees;
DROP POLICY IF EXISTS "Company can view all employees" ON employees;
DROP POLICY IF EXISTS "Company can manage employees" ON employees;
DROP POLICY IF EXISTS "Public can view employees" ON employees;
DROP POLICY IF EXISTS "Regional Manager can view region employees" ON employees;
DROP POLICY IF EXISTS "Call Center can view all employees" ON employees;
DROP POLICY IF EXISTS "Marketing Staff can view self" ON employees;

-- ============================================
-- CREATE SIMPLE POLICIES (NO RECURSION)
-- ============================================
-- Company users can view/manage all employees
CREATE POLICY "Company can view all employees"
  ON employees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = employees.company_id
      AND companies.id = auth.uid()
    )
  );

-- Company users can insert/update/delete employees
CREATE POLICY "Company can manage employees"
  ON employees FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = employees.company_id
      AND companies.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = employees.company_id
      AND companies.id = auth.uid()
    )
  );

-- Public read access (for public employee pages)
-- This is safe because it doesn't query employees table
CREATE POLICY "Public can view employees"
  ON employees FOR SELECT
  USING (true);
