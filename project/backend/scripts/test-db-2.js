const { Pool } = require('pg');

async function test(host, pw) {
    const pool = new Pool({
        host: host,
        port: 5432,
        user: 'postgres',
        password: pw,
        database: 'postgres'
    });
    try {
        await pool.connect();
        console.log(`✅ Success: ${host}, password: "${pw}"`);
        return true;
    } catch (e) {
        console.log(`❌ Failed: ${host}, password: "${pw}" - ${e.message}`);
        return false;
    } finally {
        await pool.end();
    }
}

async function run() {
    await test('localhost', 'Admin@123');
    await test('localhost', 'postgres');
    await test('127.0.0.1', 'Admin@123');
}
run();
