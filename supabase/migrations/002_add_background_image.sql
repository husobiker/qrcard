-- Add background_image_url column to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS background_image_url TEXT;

