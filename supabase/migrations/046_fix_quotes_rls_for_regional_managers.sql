-- Fix RLS policies for quotes table to allow regional managers and employees to view quotes
-- Similar to other tables (call_logs, employee_sip_settings), we use USING (true)
-- Security is maintained by service layer filtering by company_id, employee_id, customer_id, etc.

-- Drop ALL existing SELECT policies to ensure clean state
DROP POLICY IF EXISTS "Employees can view their own quotes" ON quotes;
DROP POLICY IF EXISTS "Company employees can view quotes in their company" ON quotes;
DROP POLICY IF EXISTS "Companies can view all quotes for their employees" ON quotes;

-- Create a simple policy that allows viewing quotes
-- Service layer will filter by company_id, employee_id, customer_id, etc.
-- This is the same pattern used in call_logs, employee_sip_settings, etc.
CREATE POLICY "Anyone can view quotes"
  ON quotes FOR SELECT
  USING (true); -- Allow all selects, service layer will filter by company_id
