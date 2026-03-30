const { Client } = require('pg');
require('dotenv').config();

async function checkDocUrls() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const result = await client.query('SELECT id, file_name, file_url FROM fund_documents');
        console.table(result.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkDocUrls();
