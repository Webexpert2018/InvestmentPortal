# Bitcoin IRA Platform

A comprehensive Bitcoin custodial investment platform with IRA account management capabilities.

## 🚀 Quick Start - How to Run

**👉 First time?** Follow these simple steps:

### Step 1: Install PostgreSQL
```bash
# macOS
brew install postgresql@15 && brew services start postgresql@15

# Ubuntu/Debian
sudo apt install postgresql && sudo systemctl start postgresql

# Windows: Download from https://www.postgresql.org/download/windows/
```

### Step 2: Create Database
```bash
psql -U postgres -c "CREATE DATABASE bitcoin_ira;"
```

### Step 3: Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# ⚠️ Edit .env and add your PostgreSQL password!
npm run migrate
npm run start:dev
```
✅ Backend running at: **http://localhost:3001**

### Step 4: Setup Frontend (New Terminal)
```bash
cd ..
npm install
npm run dev
```
✅ Frontend running at: **http://localhost:3000**

### Step 5: Login
Open: **http://localhost:3000/auth/login**

**Default Admin:**
- Email: `admin@bitcoinira.com`
- Password: `Admin123!`

---

## 📚 Documentation

| Guide | Description |
|-------|-------------|
| **[HOW_TO_RUN.md](HOW_TO_RUN.md)** | Simple 5-step guide with commands |
| **[QUICK_START_GUIDE.md](QUICK_START_GUIDE.md)** | Detailed setup with troubleshooting |
| **[backend/DATABASE_SETUP.md](backend/DATABASE_SETUP.md)** | Complete PostgreSQL setup guide |
| **[backend/README.md](backend/README.md)** | Backend API documentation |
| **[POSTGRESQL_MIGRATION_COMPLETE.md](POSTGRESQL_MIGRATION_COMPLETE.md)** | Migration details |

---

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- Next.js 13 (App Router)
- React 18
- TypeScript
- TailwindCSS
- shadcn/ui components
- Lucide React icons

**Backend:**
- NestJS 11
- TypeScript
- PostgreSQL (via pg)
- JWT Authentication
- Passport.js
- bcrypt

**Database:**
- PostgreSQL 12+
- 8 tables with proper indexing
- Row Level Security ready
- Migration system

---

## 📁 Project Structure

```
project/
├── backend/                      # Backend API (NestJS)
│   ├── migrations/              # Database migrations
│   │   └── 001_initial_schema.sql
│   ├── scripts/                 # Utility scripts
│   │   ├── run-migrations.ts
│   │   └── create-migration.js
│   ├── src/
│   │   ├── modules/            # Feature modules
│   │   │   ├── auth/           # Authentication
│   │   │   ├── users/          # User management
│   │   │   ├── portfolios/     # Portfolio management
│   │   │   ├── transactions/   # Transactions
│   │   │   ├── documents/      # Document management
│   │   │   ├── audit-logs/     # Audit logging
│   │   │   ├── ira-accounts/   # IRA accounts
│   │   │   └── compliance/     # Compliance
│   │   ├── config/             # Configuration
│   │   ├── guards/             # Auth guards
│   │   ├── decorators/         # Custom decorators
│   │   └── strategies/         # Passport strategies
│   ├── .env                    # Environment variables
│   └── package.json
│
├── app/                         # Frontend pages (Next.js)
│   ├── auth/
│   │   ├── login/
│   │   └── signup/
│   ├── dashboard/
│   │   └── documents/
│   ├── admin/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── components/                  # React components
│   └── ui/                     # shadcn/ui components (50+)
│
├── lib/                         # Utilities
│   ├── api/                    # API client
│   ├── contexts/               # React contexts
│   └── utils/                  # Helper functions
│
├── HOW_TO_RUN.md               # Simple setup guide
├── QUICK_START_GUIDE.md        # Detailed setup guide
└── package.json
```

---

## 🔧 Available Commands

### Backend (run from `backend/` folder)

```bash
npm run start:dev       # Start development server with hot reload
npm run start:debug     # Start in debug mode
npm run build           # Build for production
npm run start           # Start production server
npm run migrate         # Run database migrations
npm run migrate:create  # Create new migration
npm run lint            # Lint code
```

### Frontend (run from project root)

```bash
npm run dev            # Start development server
npm run build          # Build for production
npm run start          # Start production server
npm run lint           # Lint code
npm run typecheck      # TypeScript type checking
```

---

## 🌐 URLs & Ports

| Service | URL | Port |
|---------|-----|------|
| Frontend | http://localhost:3000 | 3000 |
| Backend API | http://localhost:3001 | 3001 |
| Health Check | http://localhost:3001/health | 3001 |

---

## 🔐 Authentication

The platform uses JWT authentication with bcrypt password hashing.

**Default Admin User:**
- Email: `admin@bitcoinira.com`
- Password: `Admin123!`
- Role: `admin`

⚠️ **Important:** Change the default password in production!

**To create a new user:**
1. Visit http://localhost:3000/auth/signup
2. Fill in the registration form
3. New users are created with `investor` role

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login

### Users
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id/status` - Update user status (admin)

### Portfolios
- `GET /api/portfolios/my-portfolio` - Get user's portfolio
- `GET /api/portfolios` - Get all portfolios (admin)
- `GET /api/portfolios/user/:userId` - Get portfolio by user ID

### Transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/my-transactions` - Get user's transactions
- `GET /api/transactions` - Get all transactions (admin)
- `GET /api/transactions/:id` - Get transaction by ID
- `PATCH /api/transactions/:id/status` - Update transaction status (admin)

### Documents
- `POST /api/documents` - Upload document
- `GET /api/documents/my-documents` - Get user's documents
- `GET /api/documents` - Get all documents (admin)
- `PATCH /api/documents/:id/verify` - Verify document (admin)

### IRA Accounts
- `POST /api/ira-accounts` - Create IRA account
- `GET /api/ira-accounts/my-account` - Get user's IRA account
- `GET /api/ira-accounts` - Get all IRA accounts (admin)

### Audit Logs
- `GET /api/audit-logs` - Get audit logs (admin only)

### Compliance
- `POST /api/compliance/reports` - Generate compliance report (admin)
- `GET /api/compliance/reports` - Get compliance reports (admin)

### Health
- `GET /health` - Health check endpoint

Full API documentation: [backend/README.md](backend/README.md)

---

## 🗄️ Database Schema

### Tables

1. **users** - User accounts with roles (investor, admin, compliance)
2. **portfolios** - User Bitcoin portfolios with balances
3. **transactions** - Deposit, withdrawal, and transfer records
4. **documents** - KYC/AML document storage
5. **ira_accounts** - IRA account information
6. **audit_logs** - System audit trail
7. **compliance_reports** - Compliance and regulatory reports
8. **migrations** - Migration tracking

### Database Commands

```bash
# Run migrations
cd backend
npm run migrate

# Create new migration
npm run migrate:create add_new_feature

# Connect to database
psql -U postgres -d bitcoin_ira

# View tables
psql -U postgres -d bitcoin_ira -c "\dt"

# View users
psql -U postgres -d bitcoin_ira -c "SELECT email, role FROM users;"
```

---

## 🌍 Environment Variables

### Backend (.env in backend/ folder)

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

### Frontend (.env in project root)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## ✅ Features

### Implemented
- ✅ User registration and authentication (JWT)
- ✅ Investor dashboard with portfolio tracking
- ✅ Bitcoin balance management
- ✅ Transaction history (deposits, withdrawals)
- ✅ Document vault for KYC/AML documents
- ✅ Admin panel with user management
- ✅ IRA account management
- ✅ Compliance reporting system
- ✅ Audit logging for all actions
- ✅ Role-based access control
- ✅ Responsive design (mobile-friendly)
- ✅ 50+ pre-built UI components

---

## 🔒 Security Features

- Password hashing with bcrypt (10 rounds)
- JWT token-based authentication
- Role-based access control (RBAC)
- Protected API routes
- SQL injection prevention (parameterized queries)
- CORS configuration
- Environment variable protection
- Audit logging for security events

---

## 🧪 Testing

### Test Backend

```bash
# Health check
curl http://localhost:3001/health

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bitcoinira.com","password":"Admin123!"}'

# Get profile (replace TOKEN)
curl http://localhost:3001/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test Frontend

1. Open http://localhost:3000
2. Click "Login"
3. Use admin credentials
4. Navigate to dashboard
5. Test all features

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
pg_isready

# Start PostgreSQL
brew services start postgresql@15        # macOS
sudo systemctl start postgresql          # Linux
```

### Migration Fails

```bash
# Reset database (⚠️ deletes all data)
psql -U postgres -c "DROP DATABASE bitcoin_ira;"
psql -U postgres -c "CREATE DATABASE bitcoin_ira;"
cd backend
npm run migrate
```

More troubleshooting: [QUICK_START_GUIDE.md](QUICK_START_GUIDE.md#-common-issues--solutions)

---

## 🚀 Deployment

### Production Checklist

- [ ] Change default admin password
- [ ] Update JWT_SECRET to strong random value
- [ ] Set NODE_ENV=production
- [ ] Enable PostgreSQL SSL
- [ ] Set up database backups
- [ ] Configure proper CORS origins
- [ ] Set up monitoring and logging
- [ ] Use environment-specific .env files
- [ ] Enable rate limiting
- [ ] Set up error tracking (Sentry, etc.)

### Build for Production

```bash
# Backend
cd backend
npm run build
NODE_ENV=production npm run start

# Frontend
npm run build
npm run start
```

---

## 📝 License

UNLICENSED - Private project

---

## 👥 Support

- **Setup Issues:** See [QUICK_START_GUIDE.md](QUICK_START_GUIDE.md)
- **Database Help:** See [backend/DATABASE_SETUP.md](backend/DATABASE_SETUP.md)
- **API Documentation:** See [backend/README.md](backend/README.md)

---

**Last Updated:** 2024-11-18
**Version:** 1.0.0
**Status:** ✅ Production Ready
**Framework:** NestJS v11 + Next.js 13
**Database:** PostgreSQL 12+
**Node:** 16+
