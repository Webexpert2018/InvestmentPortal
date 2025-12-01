# Database Setup Guide

This guide explains how to set up and use PostgreSQL with the Bitcoin IRA Platform backend.

## Prerequisites

- **PostgreSQL** installed on your machine (version 12 or higher)
- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)

## Installing PostgreSQL

### macOS
```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15
```

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Windows
Download and install from: https://www.postgresql.org/download/windows/

## Database Setup Steps

### 1. Create Database

Connect to PostgreSQL and create the database:

```bash
# Connect to PostgreSQL as postgres user
psql -U postgres

# Inside psql, create the database
CREATE DATABASE bitcoin_ira;

# Exit psql
\q
```

### 2. Configure Environment Variables

Copy the example environment file and update with your database credentials:

```bash
cd backend
cp .env.example .env
```

Edit `.env` file with your PostgreSQL settings:

```env
PORT=3001
NODE_ENV=development

# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bitcoin_ira
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

**Important:** Replace `your_postgres_password` with your actual PostgreSQL password!

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Database Migrations

This will create all the necessary tables:

```bash
npm run migrate
```

You should see output like:
```
🔄 Connecting to database...
   Host: localhost
   Database: bitcoin_ira
   User: postgres

📂 Found 1 migration file(s):

   ⏳ Running migration: 001_initial_schema.sql
   ✅ Completed: 001_initial_schema.sql

✅ All migrations completed successfully!

📊 Database is ready to use.
```

## Database Schema

The migration creates the following tables:

### Tables Created

1. **users** - User accounts (investors, admins, compliance officers)
2. **portfolios** - User Bitcoin portfolios
3. **transactions** - Deposit, withdrawal, and transfer records
4. **documents** - KYC/AML document storage
5. **ira_accounts** - IRA account information
6. **audit_logs** - System audit trail
7. **compliance_reports** - Compliance and regulatory reports
8. **migrations** - Migration tracking table

### Default Admin User

The migration creates a default admin user:
- **Email:** admin@bitcoinira.com
- **Password:** Admin123!

⚠️ **Change this password immediately in production!**

## Running the Backend

### Development Mode
```bash
npm run start:dev
```

The server will start on `http://localhost:3001`

### Production Mode
```bash
npm run build
npm run start
```

## Testing Database Connection

You can test the database connection:

```bash
psql -U postgres -d bitcoin_ira -c "SELECT COUNT(*) FROM users;"
```

This should return at least 1 (the default admin user).

## Creating New Migrations

To create a new migration file:

```bash
npm run migrate:create add_new_feature
```

This will create a new migration file in `migrations/` folder with the next sequential number.

Example: `002_add_new_feature.sql`

Edit the file and add your SQL, then run:

```bash
npm run migrate
```

## Migration File Structure

Each migration file should:

1. Have a descriptive name
2. Include comments explaining the changes
3. Use `CREATE TABLE IF NOT EXISTS` for safety
4. Record itself in the migrations table

Example:
```sql
-- Migration: Add user settings table
-- Created: 2024-11-18

CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'light',
    notifications_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Record migration
INSERT INTO migrations (name) VALUES ('002_add_user_settings.sql')
ON CONFLICT (name) DO NOTHING;
```

## Connecting to PostgreSQL

### Command Line (psql)
```bash
psql -U postgres -d bitcoin_ira
```

### GUI Tools

Recommended GUI tools:
- **pgAdmin** - https://www.pgadmin.org/
- **DBeaver** - https://dbeaver.io/
- **TablePlus** - https://tableplus.com/

Connection details:
- Host: localhost
- Port: 5432
- Database: bitcoin_ira
- Username: postgres
- Password: (your password)

## Useful SQL Commands

### View all tables
```sql
\dt
```

### View table structure
```sql
\d users
```

### View all users
```sql
SELECT id, email, role, status FROM users;
```

### View migration history
```sql
SELECT * FROM migrations ORDER BY executed_at;
```

### Count records in each table
```sql
SELECT
    'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'portfolios', COUNT(*) FROM portfolios
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions;
```

## Troubleshooting

### Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:** Make sure PostgreSQL is running:
```bash
# macOS
brew services restart postgresql@15

# Linux
sudo systemctl restart postgresql

# Windows
# Use Services app to restart PostgreSQL service
```

### Authentication Failed
```
Error: password authentication failed for user "postgres"
```

**Solution:** Update your `.env` file with the correct password, or reset your PostgreSQL password:
```bash
psql -U postgres
ALTER USER postgres PASSWORD 'new_password';
```

### Database Does Not Exist
```
Error: database "bitcoin_ira" does not exist
```

**Solution:** Create the database:
```bash
psql -U postgres -c "CREATE DATABASE bitcoin_ira;"
```

### Permission Denied
```
Error: permission denied for table users
```

**Solution:** Grant permissions to your user:
```sql
GRANT ALL PRIVILEGES ON DATABASE bitcoin_ira TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
```

## Backup and Restore

### Backup Database
```bash
pg_dump -U postgres bitcoin_ira > backup.sql
```

### Restore Database
```bash
psql -U postgres bitcoin_ira < backup.sql
```

## Reset Database

⚠️ **Warning:** This will delete all data!

```bash
psql -U postgres -c "DROP DATABASE bitcoin_ira;"
psql -U postgres -c "CREATE DATABASE bitcoin_ira;"
npm run migrate
```

## Production Considerations

1. **Use Strong Passwords**: Never use default passwords in production
2. **Enable SSL**: Configure PostgreSQL to use SSL connections
3. **Regular Backups**: Set up automated daily backups
4. **Connection Pooling**: The backend already uses connection pooling (pg.Pool)
5. **Monitor Performance**: Use `pg_stat_statements` extension
6. **Update Regularly**: Keep PostgreSQL updated for security patches

## Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| DB_HOST | PostgreSQL host | localhost | Yes |
| DB_PORT | PostgreSQL port | 5432 | Yes |
| DB_NAME | Database name | bitcoin_ira | Yes |
| DB_USER | Database user | postgres | Yes |
| DB_PASSWORD | Database password | postgres | Yes |
| JWT_SECRET | JWT signing secret | - | Yes |
| PORT | API server port | 3001 | No |
| NODE_ENV | Environment | development | No |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:3000 | No |

## Next Steps

After setting up the database:

1. ✅ Database created and migrated
2. ✅ Backend configured with database credentials
3. ▶️ **Start the backend:** `npm run start:dev`
4. ▶️ **Test the API:** Visit http://localhost:3001/health
5. ▶️ **Start the frontend** (see main README)

## Support

If you encounter issues:

1. Check PostgreSQL is running: `pg_isready`
2. Verify connection settings in `.env`
3. Check PostgreSQL logs for errors
4. Ensure the database exists: `psql -U postgres -l | grep bitcoin_ira`

---

**Last Updated:** 2024-11-18
**PostgreSQL Version:** 12+
**Node.js Version:** 16+
