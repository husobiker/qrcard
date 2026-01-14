-- Regions and Fixed Roles Migration
-- This migration transforms the flexible role system into a fixed role system
-- with region-based access control

-- ============================================
-- 1. CREATE REGIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for regions
CREATE INDEX IF NOT EXISTS idx_regions_company_id ON regions(company_id);

-- Enable RLS for regions
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Companies can view own regions" ON regions;
DROP POLICY IF EXISTS "Companies can insert own regions" ON regions;
DROP POLICY IF EXISTS "Companies can update own regions" ON regions;
DROP POLICY IF EXISTS "Companies can delete own regions" ON regions;

-- RLS Policies for regions
CREATE POLICY "Companies can view own regions"
  ON regions FOR SELECT
  USING (company_id = auth.uid());

CREATE POLICY "Companies can insert own regions"
  ON regions FOR INSERT
  WITH CHECK (company_id = auth.uid());

CREATE POLICY "Companies can update own regions"
  ON regions FOR UPDATE
  USING (company_id = auth.uid());

CREATE POLICY "Companies can delete own regions"
  ON regions FOR DELETE
  USING (company_id = auth.uid());

-- Function to update updated_at for regions
CREATE OR REPLACE FUNCTION update_regions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS update_regions_updated_at ON regions;

-- Trigger for regions updated_at
CREATE TRIGGER update_regions_updated_at
  BEFORE UPDATE ON regions
  FOR EACH ROW
  EXECUTE FUNCTION update_regions_updated_at();

-- ============================================
-- 2. ADD REGION_ID TO EMPLOYEES TABLE
-- ============================================
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS region_id UUID REFERENCES regions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employees_region_id ON employees(region_id);

-- ============================================
-- 3. MIGRATE ROLE_ID FROM UUID TO TEXT
-- ============================================
-- First, add a new column for text-based role
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS role TEXT;

-- Update existing role_id to role (if any exist, set to NULL for now)
-- We'll let the application handle setting the correct role
UPDATE employees SET role = NULL WHERE role IS NULL;

-- Drop the foreign key constraint on role_id if it exists
ALTER TABLE employees 
DROP CONSTRAINT IF EXISTS employees_role_id_fkey;

-- Drop the old role_id column
ALTER TABLE employees 
DROP COLUMN IF EXISTS role_id;

-- Drop constraint if exists
ALTER TABLE employees 
DROP CONSTRAINT IF EXISTS employees_role_check;

-- Add constraint to ensure role is one of the fixed roles
ALTER TABLE employees 
ADD CONSTRAINT employees_role_check 
CHECK (role IS NULL OR role IN ('Şirket', 'Bölge Sorumlusu', 'Çağrı Merkezi', 'Pazarlama Personeli', 'Müşteri'));

-- Create index on role
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);

-- ============================================
-- 4. ADD REGION_ID TO CRM_LEADS TABLE
-- ============================================
ALTER TABLE crm_leads 
ADD COLUMN IF NOT EXISTS region_id UUID REFERENCES regions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_crm_leads_region_id ON crm_leads(region_id);

-- ============================================
-- 5. ADD REGION_ID TO TASKS TABLE
-- ============================================
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS region_id UUID REFERENCES regions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_region_id ON tasks(region_id);

-- ============================================
-- 6. HELPER FUNCTIONS FOR RLS POLICIES
-- ============================================
-- Note: Helper functions removed to avoid infinite recursion
-- Role-based access control is handled in the application layer

-- ============================================
-- 7. UPDATE RLS POLICIES FOR EMPLOYEES
-- ============================================
-- Drop ALL existing policies for employees table to avoid conflicts
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

-- New RLS Policies for employees
-- Company: sees all employees (role-based filtering handled in application layer)
CREATE POLICY "Company can view all employees"
  ON employees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = employees.company_id
      AND companies.id = auth.uid()
    )
  );

-- Company can insert/update/delete employees
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
CREATE POLICY "Public can view employees"
  ON employees FOR SELECT
  USING (true);

-- ============================================
-- 8. UPDATE RLS POLICIES FOR CRM_LEADS
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "Companies can view all their leads" ON crm_leads;
DROP POLICY IF EXISTS "Companies can insert leads" ON crm_leads;
DROP POLICY IF EXISTS "Companies can update their leads" ON crm_leads;
DROP POLICY IF EXISTS "Companies can delete their leads" ON crm_leads;
DROP POLICY IF EXISTS "Company can view all leads" ON crm_leads;
DROP POLICY IF EXISTS "Company can manage leads" ON crm_leads;
DROP POLICY IF EXISTS "Employees can view their own leads" ON crm_leads;
DROP POLICY IF EXISTS "Employees can insert their own leads" ON crm_leads;
DROP POLICY IF EXISTS "Employees can update their own leads" ON crm_leads;
DROP POLICY IF EXISTS "Employees can delete their own leads" ON crm_leads;

-- Company: sees all leads
CREATE POLICY "Company can view all leads"
  ON crm_leads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = crm_leads.company_id
      AND companies.id = auth.uid()
    )
  );

-- Note: Role-based filtering for CRM leads is handled in the application layer
-- to avoid infinite recursion in RLS policies

-- Company can insert/update/delete leads
CREATE POLICY "Company can manage leads"
  ON crm_leads FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = crm_leads.company_id
      AND companies.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = crm_leads.company_id
      AND companies.id = auth.uid()
    )
  );

-- Note: Role-based CRM lead management (Call Center, Regional Manager, Marketing Staff)
-- is handled in the application layer to avoid infinite recursion in RLS policies

-- ============================================
-- 9. UPDATE RLS POLICIES FOR TASKS
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "Companies can view all employee tasks" ON tasks;
DROP POLICY IF EXISTS "Companies can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Companies can update tasks" ON tasks;
DROP POLICY IF EXISTS "Companies can delete tasks" ON tasks;
DROP POLICY IF EXISTS "Company can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Company can manage tasks" ON tasks;
DROP POLICY IF EXISTS "Employees can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Employees can update their own tasks" ON tasks;

-- Company: sees all tasks
CREATE POLICY "Company can view all tasks"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = tasks.company_id
      AND companies.id = auth.uid()
    )
  );

-- Note: Role-based task viewing (Regional Manager, Call Center, Marketing Staff)
-- is handled in the application layer to avoid infinite recursion in RLS policies

-- Company can insert/update/delete tasks
CREATE POLICY "Company can manage tasks"
  ON tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = tasks.company_id
      AND companies.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = tasks.company_id
      AND companies.id = auth.uid()
    )
    AND assigned_by = auth.uid()
  );

-- Note: Role-based task management and employee task access
-- is handled in the application layer to avoid infinite recursion in RLS policies
