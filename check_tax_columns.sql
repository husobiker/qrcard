-- Check if tax_number and tax_office columns exist in companies table
-- Run this in Supabase SQL Editor

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'companies'
  AND column_name IN ('tax_number', 'tax_office')
ORDER BY column_name;

-- If the query returns 2 rows, the migration has been applied
-- If it returns 0 rows, you need to run migration 016_add_company_tax_info.sql


