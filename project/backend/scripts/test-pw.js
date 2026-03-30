const { Pool } = require('pg');

async function test(pw) {
    const pool = new Pool({
        host: '127.0.0.1',
        port: 5432,
        user: 'postgres',
        password: pw,
        database: 'postgres'
    });
    try {
        await pool.connect();
        console.log(`✅ Success with password: "${pw}"`);
        return true;
    } catch (e) {
        console.log(`❌ Failed with password: "${pw}" - ${e.message}`);
        return false;
    } finally {
        await pool.end();
    }
}

async function run() {
    await test('');
    await test('postgres');
    await test('password');
    await test('Admin@123');
}
run();
