-- Test query to check employee credentials
-- Run this in Supabase SQL Editor to check if employee exists and has password_hash

-- Replace 'hetinkoz' with the actual username you're trying to login with
SELECT 
  id,
  first_name,
  last_name,
  username,
  CASE 
    WHEN password_hash IS NULL THEN 'NO PASSWORD HASH'
    WHEN password_hash = '' THEN 'EMPTY PASSWORD HASH'
    ELSE 'HAS PASSWORD HASH'
  END as password_status,
  LENGTH(password_hash) as hash_length
FROM employees
WHERE username = 'hetinkoz';  -- Replace with actual username

-- If you want to test password verification manually:
-- SELECT verify_password('your_password_here', (SELECT password_hash FROM employees WHERE username = 'hetinkoz'));

