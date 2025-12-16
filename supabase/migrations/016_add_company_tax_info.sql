-- Add tax information fields to companies table
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS tax_number TEXT,
ADD COLUMN IF NOT EXISTS tax_office TEXT;

COMMENT ON COLUMN companies.tax_number IS 'Vergi numarası';
COMMENT ON COLUMN companies.tax_office IS 'Vergi dairesi';



