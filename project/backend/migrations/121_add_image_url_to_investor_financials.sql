-- Add image_url to investor_financials
ALTER TABLE investor_financials 
ADD COLUMN IF NOT EXISTS image_url TEXT;
