const fs = require('fs');
const path = require('path');

const migrationName = process.argv[2];

if (!migrationName) {
  console.error('❌ Please provide a migration name');
  console.log('Usage: npm run migrate:create <migration_name>');
  console.log('Example: npm run migrate:create add_user_settings_table');
  process.exit(1);
}

const migrationsDir = path.join(__dirname, '../migrations');

if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

const existingMigrations = fs
  .readdirSync(migrationsDir)
  .filter(file => file.endsWith('.sql'));

const nextNumber = String(existingMigrations.length + 1).padStart(3, '0');
const fileName = `${nextNumber}_${migrationName}.sql`;
const filePath = path.join(migrationsDir, fileName);

const template = `-- Migration: ${migrationName}
-- Created: ${new Date().toISOString()}

-- Write your SQL migration here

-- Example:
-- CREATE TABLE IF NOT EXISTS example_table (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     name VARCHAR(255) NOT NULL,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
-- );

-- Don't forget to record the migration
INSERT INTO migrations (name) VALUES ('${fileName}')
ON CONFLICT (name) DO NOTHING;
`;

fs.writeFileSync(filePath, template);

console.log('✅ Migration file created successfully!');
console.log(`📄 File: migrations/${fileName}`);
console.log('\nNext steps:');
console.log('1. Edit the migration file and add your SQL');
console.log('2. Run: npm run migrate');
