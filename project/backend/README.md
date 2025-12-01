# Bitcoin IRA Platform - Backend API

NestJS-based backend API for the Bitcoin IRA custodial investment platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- npm

### Installation

1. **Install dependencies**
```bash
npm install
```

2. **Set up PostgreSQL database**

Create database:
```bash
psql -U postgres -c "CREATE DATABASE bitcoin_ira;"
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bitcoin_ira
DB_USER=postgres
DB_PASSWORD=your_password
```

4. **Run migrations**
```bash
npm run migrate
```

5. **Start the server**
```bash
npm run start:dev
```

The API will be available at: **http://localhost:3001**

## 📚 Documentation

- **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** - Complete database setup guide with troubleshooting
- **Health Check:** http://localhost:3001/health

## 🗄️ Database

### Quick Setup
```bash
# 1. Create database
psql -U postgres -c "CREATE DATABASE bitcoin_ira;"

# 2. Configure .env file
cp .env.example .env
# Edit .env with your credentials

# 3. Run migrations
npm run migrate
```

### Migration Commands

| Command | Description |
|---------|-------------|
| `npm run migrate` | Run all pending migrations |
| `npm run migrate:create <name>` | Create a new migration file |

### Default Admin User

After running migrations, you can login with:
- **Email:** admin@bitcoinira.com
- **Password:** Admin123!

⚠️ **Change this password in production!**

## 🏗️ Project Structure

```
backend/
├── migrations/              # Database migrations
│   └── 001_initial_schema.sql
├── scripts/                 # Utility scripts
│   ├── run-migrations.ts    # Migration runner
│   └── create-migration.js  # Migration creator
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.ts      # PostgreSQL connection
│   │   └── supabase.ts      # (Legacy - being removed)
│   ├── decorators/          # Custom decorators
│   ├── guards/              # Auth guards
│   ├── strategies/          # Passport strategies
│   ├── modules/             # Feature modules
│   │   ├── auth/            # Authentication
│   │   ├── users/           # User management
│   │   ├── portfolios/      # Portfolio management
│   │   ├── transactions/    # Transaction handling
│   │   ├── documents/       # Document management
│   │   ├── audit-logs/      # Audit logging
│   │   ├── ira-accounts/    # IRA accounts
│   │   └── compliance/      # Compliance reports
│   ├── app.module.ts        # Root module
│   ├── main.ts              # Application entry point
│   └── health.controller.ts # Health check endpoint
├── .env                     # Environment variables
├── package.json             # Dependencies & scripts
├── tsconfig.json            # TypeScript configuration
├── nest-cli.json            # NestJS CLI configuration
└── DATABASE_SETUP.md        # Database setup guide
```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run start:dev` | Start in development mode with hot reload |
| `npm run start:debug` | Start in debug mode |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run migrate` | Run database migrations |
| `npm run migrate:create <name>` | Create new migration |
| `npm run lint` | Lint code |

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login

### Users
- `GET /api/users/profile` - Get current user
- `PUT /api/users/profile` - Update profile
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id/status` - Update user status (admin)

### Portfolios
- `GET /api/portfolios/my-portfolio` - Get user's portfolio
- `GET /api/portfolios` - Get all portfolios (admin)
- `GET /api/portfolios/user/:userId` - Get portfolio by user

### Transactions
- `GET /api/transactions/my-transactions` - Get user's transactions
- `GET /api/transactions` - Get all transactions (admin)
- `GET /api/transactions/:id` - Get transaction by ID
- `POST /api/transactions` - Create transaction
- `PATCH /api/transactions/:id/status` - Update status (admin)

### Documents
- `GET /api/documents/my-documents` - Get user's documents
- `GET /api/documents` - Get all documents (admin)
- `POST /api/documents` - Upload document
- `PATCH /api/documents/:id/verify` - Verify document (admin)

### IRA Accounts
- `GET /api/ira-accounts/my-account` - Get user's IRA account
- `GET /api/ira-accounts` - Get all accounts (admin)
- `POST /api/ira-accounts` - Create IRA account

### Audit Logs
- `GET /api/audit-logs` - Get audit logs (admin)

### Compliance
- `GET /api/compliance/reports` - Get reports (admin)
- `POST /api/compliance/reports` - Generate report (admin)

### Health
- `GET /health` - Health check

## 🔐 Authentication

All endpoints (except `/health`, `/api/auth/signup`, and `/api/auth/login`) require JWT authentication.

Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## 🗃️ Database Schema

The database includes 8 main tables:

1. **users** - User accounts
2. **portfolios** - Bitcoin portfolios
3. **transactions** - Financial transactions
4. **documents** - KYC/AML documents
5. **ira_accounts** - IRA account information
6. **audit_logs** - System audit trail
7. **compliance_reports** - Regulatory reports
8. **migrations** - Migration tracking

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for complete schema details.

## 🌐 Environment Variables

Required variables in `.env`:

```env
# Server
PORT=3001
NODE_ENV=development

# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bitcoin_ira
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:3000
```

## 🛠️ Technology Stack

- **Framework:** NestJS 11
- **Language:** TypeScript
- **Database:** PostgreSQL (via pg)
- **Authentication:** JWT with Passport
- **Validation:** class-validator
- **ORM:** Raw SQL queries with pg

## 🧪 Testing the Setup

After starting the server, test the endpoints:

```bash
# Health check
curl http://localhost:3001/health

# Login as admin
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bitcoinira.com","password":"Admin123!"}'

# Get profile (use token from login response)
curl http://localhost:3001/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_isready

# Check database exists
psql -U postgres -l | grep bitcoin_ira

# Test connection
psql -U postgres -d bitcoin_ira -c "SELECT NOW();"
```

### Migration Issues

```bash
# Check migration status
psql -U postgres -d bitcoin_ira -c "SELECT * FROM migrations;"

# Reset database (⚠️ deletes all data)
psql -U postgres -c "DROP DATABASE bitcoin_ira;"
psql -U postgres -c "CREATE DATABASE bitcoin_ira;"
npm run migrate
```

### Port Already in Use

```bash
# Find process using port 3001
lsof -ti:3001

# Kill the process
kill -9 $(lsof -ti:3001)
```

## 📦 Dependencies

### Core
- `@nestjs/common` - NestJS common utilities
- `@nestjs/core` - NestJS core
- `@nestjs/jwt` - JWT utilities
- `@nestjs/passport` - Passport integration
- `pg` - PostgreSQL client
- `bcrypt` - Password hashing

### Development
- `@nestjs/cli` - NestJS CLI
- `typescript` - TypeScript compiler
- `ts-node` - TypeScript execution

## 🔄 Migration to PostgreSQL

This backend has been updated to use PostgreSQL instead of Supabase. All services now use direct SQL queries via the `pg` library.

Key changes:
- ✅ PostgreSQL connection pool configured
- ✅ Migration system implemented
- ✅ All services updated to use SQL queries
- ✅ Database schema created via migrations

## 🚀 Deployment

### Production Checklist

- [ ] Change default admin password
- [ ] Update JWT_SECRET to a strong random value
- [ ] Enable PostgreSQL SSL
- [ ] Set up database backups
- [ ] Configure proper CORS settings
- [ ] Set NODE_ENV=production
- [ ] Use environment-specific .env files
- [ ] Set up monitoring and logging

### Build for Production

```bash
npm run build
NODE_ENV=production npm run start
```

## 📝 License

UNLICENSED

## 👥 Support

For database setup help, see [DATABASE_SETUP.md](./DATABASE_SETUP.md)

---

**Last Updated:** 2024-11-18
**Framework:** NestJS v11
**Database:** PostgreSQL 12+
**Node:** 16+
