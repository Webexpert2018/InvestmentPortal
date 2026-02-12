// Quick DB connection test
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
	connectionString: process.env.DATABASE_URL || undefined,
	host: process.env.PGHOST || process.env.DB_HOST,
	port: process.env.PGPORT ? Number(process.env.PGPORT) : (process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined),
	user: process.env.PGUSER || process.env.DB_USER,
	password: process.env.PGPASSWORD || process.env.DB_PASSWORD,
	database: process.env.PGDATABASE || process.env.DB_NAME,
	ssl: (process.env.PGSSLMODE === 'disable') ? false : undefined,
});

(async () => {
	try {
		await client.connect();
		console.log('Connected to Postgres OK');
		const res = await client.query('SELECT NOW()');
		console.log('Server time:', res.rows[0]);
		await client.end();
		process.exit(0);
	} catch (err) {
		console.error('DB connection error:', err);
		process.exit(1);
	}
})();
