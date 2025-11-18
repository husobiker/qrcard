-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  website TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  job_title TEXT,
  department TEXT,
  phone TEXT,
  email TEXT,
  about TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  profile_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_created_at ON employees(created_at DESC);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies table
-- Companies can only see and update their own data
CREATE POLICY "Companies can view own data"
  ON companies FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Companies can update own data"
  ON companies FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Companies can insert own data"
  ON companies FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Public read access for companies (needed for public employee pages)
CREATE POLICY "Public can view companies"
  ON companies FOR SELECT
  USING (true);

-- RLS Policies for employees table
-- Company admins can manage their own employees
CREATE POLICY "Companies can view own employees"
  ON employees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = employees.company_id
      AND companies.id = auth.uid()
    )
  );

CREATE POLICY "Companies can insert own employees"
  ON employees FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = employees.company_id
      AND companies.id = auth.uid()
    )
  );

CREATE POLICY "Companies can update own employees"
  ON employees FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = employees.company_id
      AND companies.id = auth.uid()
    )
  );

CREATE POLICY "Companies can delete own employees"
  ON employees FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = employees.company_id
      AND companies.id = auth.uid()
    )
  );

-- Public read access for employees (needed for public employee pages)
CREATE POLICY "Public can view employees"
  ON employees FOR SELECT
  USING (true);

-- Create storage bucket for company assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for company-assets bucket
CREATE POLICY "Public can view company assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-assets');

CREATE POLICY "Authenticated users can upload company assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'company-assets' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own company assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'company-assets' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete own company assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'company-assets' AND
    auth.role() = 'authenticated'
  );

