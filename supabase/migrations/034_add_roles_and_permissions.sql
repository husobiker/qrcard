-- Roles and permissions tables for role-based access control
-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  page_name TEXT NOT NULL,
  can_view BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_id, page_name)
);

-- Add role_id column to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_roles_company_id ON roles(company_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_employees_role_id ON employees(role_id);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roles table
-- Companies can view their own roles
CREATE POLICY "Companies can view own roles"
  ON roles FOR SELECT
  USING (company_id = auth.uid());

-- Companies can insert their own roles
CREATE POLICY "Companies can insert own roles"
  ON roles FOR INSERT
  WITH CHECK (company_id = auth.uid());

-- Companies can update their own roles
CREATE POLICY "Companies can update own roles"
  ON roles FOR UPDATE
  USING (company_id = auth.uid());

-- Companies can delete their own roles
CREATE POLICY "Companies can delete own roles"
  ON roles FOR DELETE
  USING (company_id = auth.uid());

-- RLS Policies for role_permissions table
-- Companies can view permissions for their roles
CREATE POLICY "Companies can view role permissions"
  ON role_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.id = role_permissions.role_id
      AND roles.company_id = auth.uid()
    )
  );

-- Companies can insert permissions for their roles
CREATE POLICY "Companies can insert role permissions"
  ON role_permissions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.id = role_permissions.role_id
      AND roles.company_id = auth.uid()
    )
  );

-- Companies can update permissions for their roles
CREATE POLICY "Companies can update role permissions"
  ON role_permissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.id = role_permissions.role_id
      AND roles.company_id = auth.uid()
    )
  );

-- Companies can delete permissions for their roles
CREATE POLICY "Companies can delete role permissions"
  ON role_permissions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.id = role_permissions.role_id
      AND roles.company_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on roles table
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_roles_updated_at();
