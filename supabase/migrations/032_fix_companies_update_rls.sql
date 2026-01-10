-- Fix companies UPDATE RLS policy to include WITH CHECK clause
-- This ensures the policy works correctly for UPDATE operations

DROP POLICY IF EXISTS "Companies can update own data" ON companies;

CREATE POLICY "Companies can update own data"
  ON companies FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);




