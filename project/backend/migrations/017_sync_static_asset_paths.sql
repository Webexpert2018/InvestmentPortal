-- 017: Sync static asset paths for Vercel
-- This migration updates existing local paths to the new Frontend static structure.

-- 1. Update Fund Image paths
UPDATE funds 
SET image_url = REPLACE(
  REPLACE(image_url, '/public/uploads/fund-images/', '/images/funds/'),
  '/public/fund-images/', '/images/funds/'
)
WHERE image_url LIKE '/public/%';

-- 2. Update Fund Document paths
UPDATE fund_documents 
SET file_url = REPLACE(file_url, '/public/documents/', '/documents/')
WHERE file_url LIKE '/public/documents/%';
