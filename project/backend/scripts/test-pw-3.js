const { Pool } = require('pg');

async function test(pw) {
    const pool = new Pool({
        host: '127.0.0.1',
        port: 5432,
        user: 'postgres',
        password: pw,
        database: 'bitcoin_ira'
    });
    try {
        await pool.connect();
        console.log(`✅ Success with password: "${pw}" for bitcoin_ira`);
        return true;
    } catch (e) {
        console.log(`❌ Failed with password: "${pw}" for bitcoin_ira - ${e.message}`);
        return false;
    } finally {
        await pool.end();
    }
}

async function run() {
    await test('Admin@123');
    await test('postgres');
    await test('password');
}
run();
