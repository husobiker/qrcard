-- Fix RLS policies for company_sip_settings to allow employees to view
-- Employees don't use Supabase auth, so we need to allow public/anon access
-- Security is maintained by service layer filtering by company_id

-- Drop all existing SELECT policies
DROP POLICY IF EXISTS "Employees can view their company SIP settings" ON company_sip_settings;
DROP POLICY IF EXISTS "Companies can view their own SIP settings" ON company_sip_settings;
DROP POLICY IF EXISTS "Public can view company SIP settings" ON company_sip_settings;
DROP POLICY IF EXISTS "Anyone can view company SIP settings" ON company_sip_settings;

-- Create a policy that allows both authenticated and anon users to view
-- This is needed because employees don't use Supabase auth (they use custom auth)
-- The service layer will filter by company_id to ensure security
-- Note: This allows public read access, but INSERT/UPDATE/DELETE are still protected
-- Using the same pattern as employee_sip_settings (migration 027)
CREATE POLICY "Anyone can view company SIP settings"
  ON company_sip_settings FOR SELECT
  USING (true);

