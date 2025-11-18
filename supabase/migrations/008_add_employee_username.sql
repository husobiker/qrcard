-- Add username column to employees table (only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'username'
  ) THEN
    ALTER TABLE employees ADD COLUMN username TEXT UNIQUE;
    CREATE INDEX IF NOT EXISTS idx_employees_username ON employees(username);
  END IF;
END $$;

-- Function to generate unique username from first_name and last_name
CREATE OR REPLACE FUNCTION generate_username(first_name TEXT, last_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create base username: first letter of first_name + last_name (lowercase, no spaces, no special chars)
  base_username := LOWER(
    SUBSTRING(TRIM(first_name), 1, 1) || 
    REGEXP_REPLACE(TRIM(last_name), '[^a-zA-Z0-9]', '', 'g')
  );
  
  -- Check if username exists, if so, append number
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM employees WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::TEXT;
  END LOOP;
  
  RETURN final_username;
END;
$$ LANGUAGE plpgsql;

-- Function to authenticate employee by username and password
CREATE OR REPLACE FUNCTION authenticate_employee(emp_username TEXT, emp_password TEXT)
RETURNS TABLE (
  id UUID,
  company_id UUID,
  first_name TEXT,
  last_name TEXT,
  username TEXT,
  job_title TEXT,
  department TEXT,
  phone TEXT,
  email TEXT,
  about TEXT,
  social_links JSONB,
  profile_image_url TEXT,
  extra_links JSONB,
  meeting_link TEXT,
  cv_url TEXT,
  pdf_url TEXT,
  brochure_url TEXT,
  presentation_url TEXT,
  gallery_images JSONB,
  available_hours JSONB,
  default_duration_minutes INTEGER,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  emp_record RECORD;
BEGIN
  -- Find employee by username
  SELECT e.* INTO emp_record
  FROM employees e
  WHERE e.username = emp_username;
  
  -- If employee not found, return empty
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Verify password
  IF emp_record.password_hash IS NULL OR 
     NOT verify_password(emp_password, emp_record.password_hash) THEN
    RETURN;
  END IF;
  
  -- Return employee data (excluding password_hash)
  RETURN QUERY
  SELECT 
    emp_record.id,
    emp_record.company_id,
    emp_record.first_name,
    emp_record.last_name,
    emp_record.username,
    emp_record.job_title,
    emp_record.department,
    emp_record.phone,
    emp_record.email,
    emp_record.about,
    emp_record.social_links,
    emp_record.profile_image_url,
    emp_record.extra_links,
    emp_record.meeting_link,
    emp_record.cv_url,
    emp_record.pdf_url,
    emp_record.brochure_url,
    emp_record.presentation_url,
    emp_record.gallery_images,
    emp_record.available_hours,
    emp_record.default_duration_minutes,
    emp_record.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON COLUMN employees.username IS 'Unique username for employee login';
COMMENT ON FUNCTION generate_username IS 'Generates a unique username from first_name and last_name';
COMMENT ON FUNCTION authenticate_employee IS 'Authenticates an employee by username and password, returns employee data if successful';

