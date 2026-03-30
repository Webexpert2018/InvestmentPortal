const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function fixDocumentPaths() {
    // 1. Move files
    const oldDir = path.join(process.cwd(), 'public', 'uploads', 'documents');
    const newDir = path.join(process.cwd(), 'uploads', 'documents');

    if (!fs.existsSync(newDir)) {
        fs.mkdirSync(newDir, { recursive: true });
    }

    if (fs.existsSync(oldDir)) {
        const files = fs.readdirSync(oldDir);
        for (const file of files) {
            const oldPath = path.join(oldDir, file);
            const newPath = path.join(newDir, file);
            console.log(`🚚 Moving ${file} to ${newDir}`);
            fs.renameSync(oldPath, newPath);
        }
    }

    // 2. Update DB
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('🚀 Connected to database.');
        
        // Find records with /uploads/documents and no /public
        const result = await client.query(`
            UPDATE fund_documents 
            SET file_url = '/public' || file_url 
            WHERE file_url LIKE '/uploads/%' 
            AND file_url NOT LIKE '/public%'
            RETURNING id, file_url;
        `);
        
        console.log(`✅ Updated ${result.rowCount} records.`);
        result.rows.forEach(row => console.log(`   - ID: ${row.id} -> ${row.file_url}`));

    } catch (err) {
        console.error('❌ Error updating DB:', err.message);
    } finally {
        await client.end();
    }
}

fixDocumentPaths();
