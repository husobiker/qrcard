-- Add language column to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'tr' CHECK (language IN ('tr', 'en'));

