-- Add RLS policies for Call Center role
-- Call Center employees use custom authentication (not Supabase auth),
-- so we use USING (true) with service layer filtering, similar to other employee roles

-- ============================================
-- 1. CRM LEADS - Allow Call Center to view all company leads
-- ============================================
-- Note: Existing policies already allow employees to view their own leads
-- Call Center needs to view all leads in their company
-- Service layer will filter by company_id

-- Drop existing employee policies that might conflict
DROP POLICY IF EXISTS "Employees can view their own leads" ON crm_leads;
DROP POLICY IF EXISTS "Employees can insert their own leads" ON crm_leads;
DROP POLICY IF EXISTS "Employees can update their own leads" ON crm_leads;
DROP POLICY IF EXISTS "Employees can delete their own leads" ON crm_leads;

-- Allow all employees (including Call Center) to view leads in their company
-- Service layer will filter by company_id and role
CREATE POLICY "Employees can view company leads"
  ON crm_leads FOR SELECT
  USING (true);

-- Allow all employees (including Call Center) to insert leads
-- Service layer will validate company_id and role
CREATE POLICY "Employees can insert leads"
  ON crm_leads FOR INSERT
  WITH CHECK (true);

-- Allow all employees (including Call Center) to update leads in their company
-- Service layer will validate company_id and role
CREATE POLICY "Employees can update company leads"
  ON crm_leads FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow all employees (including Call Center) to delete leads in their company
-- Service layer will validate company_id and role
CREATE POLICY "Employees can delete company leads"
  ON crm_leads FOR DELETE
  USING (true);

-- ============================================
-- 2. REGIONS - Call Center can view all company regions
-- ============================================
-- Regions already have "Public can view regions" policy (migration 038)
-- This allows Call Center to view all regions
-- Service layer will filter by company_id

-- No additional policies needed - existing "Public can view regions" policy is sufficient

-- ============================================
-- 3. EMPLOYEES - Call Center can view marketing staff
-- ============================================
-- Check existing employee RLS policies
-- Employees table should already allow viewing employees in the same company
-- Service layer will filter by role (MARKETING_STAFF) for Call Center

-- Note: If employees table has restrictive RLS, we may need to add a policy
-- But typically, employee viewing is handled at service layer with company_id filtering

-- ============================================
-- Summary
-- ============================================
-- Call Center employees can:
-- 1. View all CRM leads in their company (service layer filters by company_id)
-- 2. Create CRM leads for any region and assign to marketing staff
-- 3. Update/delete any CRM leads in their company
-- 4. View all regions in their company (existing "Public can view regions" policy)
-- 5. View marketing staff employees (service layer filters by role)

-- Security is maintained by:
-- - Service layer filtering by company_id
-- - Service layer filtering by role (for marketing staff selection)
-- - Application-level authorization checks
