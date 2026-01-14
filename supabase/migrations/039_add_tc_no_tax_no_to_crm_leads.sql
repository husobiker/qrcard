-- Add TC No and Tax No fields to crm_leads table
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS tc_no VARCHAR(11),
ADD COLUMN IF NOT EXISTS tax_no VARCHAR(11);

-- Add constraints to ensure max 11 characters
ALTER TABLE crm_leads
ADD CONSTRAINT crm_leads_tc_no_length CHECK (tc_no IS NULL OR LENGTH(tc_no) <= 11),
ADD CONSTRAINT crm_leads_tax_no_length CHECK (tax_no IS NULL OR LENGTH(tax_no) <= 11);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_crm_leads_tc_no ON crm_leads(tc_no);
CREATE INDEX IF NOT EXISTS idx_crm_leads_tax_no ON crm_leads(tax_no);
