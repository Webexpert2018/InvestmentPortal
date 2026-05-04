const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
	connectionString: process.env.DATABASE_URL,
});

(async () => {
	try {
		await client.connect();
		console.log('🚀 Running migration: 058_make_ira_fields_nullable.sql');
		const migrationPath = path.join(__dirname, 'migrations', '058_make_ira_fields_nullable.sql');
		const sql = fs.readFileSync(migrationPath, 'utf8');
		await client.query(sql);
		console.log('✅ Migration successful!');
		await client.end();
		process.exit(0);
	} catch (err) {
		console.error('❌ Migration failed:', err);
		process.exit(1);
	}
})();
