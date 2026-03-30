const { Client } = require('pg');
require('dotenv').config();

async function addFileSizeColumn() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('🚀 Connected to database.');
        
        console.log('🚀 Adding file_size column to fund_documents table...');
        await client.query(`
            ALTER TABLE fund_documents ADD COLUMN IF NOT EXISTS file_size BIGINT;
        `);
        console.log('✅ Column added.');

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await client.end();
    }
}

addFileSizeColumn();
