-- Fix ambiguous column reference in authenticate_employee function
-- Drop existing function first to allow return type change
DROP FUNCTION IF EXISTS authenticate_employee(TEXT, TEXT);

CREATE FUNCTION authenticate_employee(emp_username TEXT, emp_password TEXT)
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
  -- Find employee by username (using table alias to avoid ambiguity)
  SELECT 
    e.id,
    e.company_id,
    e.first_name,
    e.last_name,
    e.username,
    e.job_title,
    e.department,
    e.phone,
    e.email,
    e.about,
    e.social_links,
    e.profile_image_url,
    e.extra_links,
    e.meeting_link,
    e.cv_url,
    e.pdf_url,
    e.brochure_url,
    e.presentation_url,
    e.gallery_images,
    e.available_hours,
    e.default_duration_minutes,
    e.created_at,
    e.password_hash
  INTO emp_record
  FROM employees e
  WHERE e.username = emp_username;
  
  -- If employee not found, return empty
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Verify password using crypt directly (more reliable)
  IF emp_record.password_hash IS NULL THEN
    RETURN;
  END IF;
  
  -- Use crypt directly instead of verify_password function to avoid any issues
  IF emp_record.password_hash != crypt(emp_password, emp_record.password_hash) THEN
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

