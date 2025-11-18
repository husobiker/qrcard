-- Add password field to employees table (only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE employees ADD COLUMN password_hash TEXT;
  END IF;
END $$;

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to hash password using bcrypt
CREATE OR REPLACE FUNCTION hash_password(plain_password TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Use crypt function from pgcrypto to hash password
  -- This uses bcrypt algorithm with cost factor 10
  RETURN crypt(plain_password, gen_salt('bf', 10));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify password
CREATE OR REPLACE FUNCTION verify_password(plain_password TEXT, hashed_password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN hashed_password = crypt(plain_password, hashed_password);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON COLUMN employees.password_hash IS 'Hashed password for employee access (bcrypt hash)';
COMMENT ON FUNCTION hash_password IS 'Hashes a plain text password using bcrypt';
COMMENT ON FUNCTION verify_password IS 'Verifies a plain text password against a bcrypt hash';

