-- Fix existing employees that might not have password_hash
-- This will set a default password for employees without one
-- IMPORTANT: Replace 'default_password_123' with a secure password

-- First, check which employees don't have passwords:
SELECT 
  id,
  first_name,
  last_name,
  username,
  CASE 
    WHEN password_hash IS NULL THEN 'NO PASSWORD'
    WHEN password_hash = '' THEN 'EMPTY PASSWORD'
    ELSE 'HAS PASSWORD'
  END as password_status
FROM employees
WHERE password_hash IS NULL OR password_hash = '';

-- If you want to set a password for an employee without one:
-- Replace 'username_here' and 'new_password_here' with actual values
/*
UPDATE employees 
SET password_hash = hash_password('new_password_here')
WHERE username = 'username_here' 
  AND (password_hash IS NULL OR password_hash = '');
*/

-- Test password verification for a specific employee:
-- Replace 'username_here' and 'test_password' with actual values
/*
SELECT 
  username,
  CASE 
    WHEN password_hash IS NULL THEN 'NO PASSWORD HASH'
    WHEN password_hash = crypt('test_password', password_hash) THEN 'PASSWORD MATCHES'
    ELSE 'PASSWORD DOES NOT MATCH'
  END as test_result
FROM employees
WHERE username = 'username_here';
*/

