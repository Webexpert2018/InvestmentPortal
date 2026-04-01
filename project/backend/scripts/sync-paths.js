const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

async function syncPaths() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // 1. Update Funds table image_url
    // Handle both /public/uploads/fund-images/ and /public/fund-images/
    const updateFundsQuery = `
      UPDATE funds 
      SET image_url = REPLACE(
        REPLACE(image_url, '/public/uploads/fund-images/', '/images/funds/'),
        '/public/fund-images/', '/images/funds/'
      )
      WHERE image_url LIKE '/public/%';
    `;
    const resFunds = await client.query(updateFundsQuery);
    console.log(`✅ Updated ${resFunds.rowCount} fund image paths.`);

    // 2. Update fund_documents table file_url
    const updateDocsQuery = `
      UPDATE fund_documents 
      SET file_url = REPLACE(file_url, '/public/documents/', '/documents/')
      WHERE file_url LIKE '/public/documents/%';
    `;
    const resDocs = await client.query(updateDocsQuery);
    console.log(`✅ Updated ${resDocs.rowCount} document file paths.`);

    // 3. Update Investments table if it has image/document paths (optional check)
    // Check if investments or fund_flows have paths
    
    console.log('🚀 Path synchronization complete!');
  } catch (err) {
    console.error('❌ Error during synchronization:', err);
  } finally {
    await client.end();
  }
}

syncPaths();
