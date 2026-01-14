-- Fix RLS policies for regions table to allow employees to view their assigned regions
-- Employees don't use Supabase auth, so we need to allow public read access
-- Security is maintained by service layer filtering

-- Drop existing policies
DROP POLICY IF EXISTS "Companies can view own regions" ON regions;
DROP POLICY IF EXISTS "Companies can insert own regions" ON regions;
DROP POLICY IF EXISTS "Companies can update own regions" ON regions;
DROP POLICY IF EXISTS "Companies can delete own regions" ON regions;
DROP POLICY IF EXISTS "Public can view regions" ON regions;

-- RLS Policies for regions
-- Companies can view their own regions
CREATE POLICY "Companies can view own regions"
  ON regions FOR SELECT
  USING (company_id = auth.uid());

-- Public read access for regions (employees need this to view their assigned region)
-- Service layer will filter by employee's region_id
CREATE POLICY "Public can view regions"
  ON regions FOR SELECT
  USING (true);

-- Companies can insert their own regions
CREATE POLICY "Companies can insert own regions"
  ON regions FOR INSERT
  WITH CHECK (company_id = auth.uid());

-- Companies can update their own regions
CREATE POLICY "Companies can update own regions"
  ON regions FOR UPDATE
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

-- Companies can delete their own regions
CREATE POLICY "Companies can delete own regions"
  ON regions FOR DELETE
  USING (company_id = auth.uid());
