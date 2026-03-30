const { Client } = require('pg');
require('dotenv').config();

async function createFundDocumentsTable() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('🚀 Connected to database.');
        
        console.log('🚀 Creating fund_documents table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS fund_documents (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
                file_name VARCHAR(255) NOT NULL,
                file_url TEXT NOT NULL,
                document_type VARCHAR(50) NOT NULL,
                tax_year INTEGER,
                description TEXT,
                note TEXT,
                uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Table created.');

        await client.query(`CREATE INDEX IF NOT EXISTS idx_fund_documents_fund_id ON fund_documents(fund_id);`);
        console.log('✅ Index created.');

        await client.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        `);

        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_fund_documents_updated_at') THEN
                    CREATE TRIGGER update_fund_documents_updated_at 
                    BEFORE UPDATE ON fund_documents
                    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
                END IF;
            END $$;
        `);
        console.log('✅ Trigger created.');

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await client.end();
    }
}

createFundDocumentsTable();
