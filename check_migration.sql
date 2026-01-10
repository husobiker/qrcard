-- Check if API fields exist in companies table
-- Run this in Supabase SQL Editor

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'companies'
  AND column_name IN ('api_endpoint', 'santral_id', 'api_key', 'api_secret')
ORDER BY column_name;

-- If the query returns 4 rows, the migration has been applied
-- If it returns 0 rows, the migration needs to be run




