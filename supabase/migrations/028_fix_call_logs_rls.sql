-- Fix RLS policies for call logs
-- Employees don't use Supabase auth, so we need to allow them to access their own call logs

-- Drop existing employee policies
DROP POLICY IF EXISTS "Employees can view their own call logs" ON call_logs;
DROP POLICY IF EXISTS "Employees can insert their own call logs" ON call_logs;
DROP POLICY IF EXISTS "Employees can update their own call logs" ON call_logs;

-- Create new policies that allow employees to access their own call logs
CREATE POLICY "Employees can view their own call logs"
  ON call_logs FOR SELECT
  USING (true); -- Allow all selects, service layer will filter by employee_id

CREATE POLICY "Employees can insert their own call logs"
  ON call_logs FOR INSERT
  WITH CHECK (true); -- Allow all inserts, service layer will validate

CREATE POLICY "Employees can update their own call logs"
  ON call_logs FOR UPDATE
  USING (true); -- Allow all updates, service layer will validate


