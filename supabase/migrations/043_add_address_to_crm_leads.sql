-- Add address column to crm_leads table
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS address TEXT;
