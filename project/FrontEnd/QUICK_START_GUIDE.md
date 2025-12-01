# 🚀 Quick Start Guide - Running the Application

This guide will help you run the Bitcoin IRA Platform on your local system.

## Prerequisites

Before starting, make sure you have:

- ✅ **Node.js** (version 16 or higher) - [Download](https://nodejs.org/)
- ✅ **PostgreSQL** (version 12 or higher) - [Download](https://www.postgresql.org/download/)
- ✅ **npm** (comes with Node.js)
- ✅ **Terminal/Command Prompt**

---

## 📋 Step-by-Step Setup

### Step 1: Install PostgreSQL

Choose your operating system:

#### macOS
```bash
# Install using Homebrew
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Verify it's running
pg_isready
```

#### Windows
1. Download installer from: https://www.postgresql.org/download/windows/
2. Run the installer (use default settings)
3. Remember the password you set for the `postgres` user
4. PostgreSQL service starts automatically

#### Ubuntu/Debian Linux
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify it's running
pg_isready
```

---

### Step 2: Create Database

Open your terminal and run:

```bash
# Connect to PostgreSQL (you may be prompted for password)
psql -U postgres

# Inside psql, create the database
CREATE DATABASE bitcoin_ira;

# Exit psql
\q
```

**Note for Linux users:** You may need to use:
```bash
sudo -u postgres psql
```

---

### Step 3: Set Up Backend

#### 3.1 Navigate to backend folder
```bash
cd backend
```

#### 3.2 Install dependencies
```bash
npm install
```

This will install all required packages (may take 2-3 minutes).

#### 3.3 Configure environment variables

Copy the example file:
```bash
# macOS/Linux
cp .env.example .env

# Windows Command Prompt
copy .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Edit the `.env` file with your settings:

**Open `.env` in any text editor and update:**

```env
PORT=3001
NODE_ENV=development

# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bitcoin_ira
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here    # ← CHANGE THIS!

# JWT Configuration
JWT_SECRET=change_this_to_a_random_secret_key    # ← CHANGE THIS!
JWT_EXPIRES_IN=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

**Important:** Replace:
- `your_postgres_password_here` with your actual PostgreSQL password
- `change_this_to_a_random_secret_key` with a random string (e.g., `my-super-secret-jwt-key-2024`)

#### 3.4 Run database migrations

```bash
npm run migrate
```

You should see:
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

If you see an error, check:
- PostgreSQL is running: `pg_isready`
- Password in `.env` is correct
- Database exists: `psql -U postgres -l | grep bitcoin_ira`

#### 3.5 Start the backend server

```bash
npm run start:dev
```

You should see:
```
🚀 Bitcoin IRA Platform API (NestJS) running on port 3001
📊 Environment: development
🔗 Health check: http://localhost:3001/health
```

**Test it works:**

Open a new terminal and run:
```bash
curl http://localhost:3001/health
```

Or open in browser: http://localhost:3001/health

You should see: `{"status":"ok","timestamp":"...","framework":"NestJS"}`

✅ **Backend is running!** Keep this terminal open.

---

### Step 4: Set Up Frontend

Open a **NEW terminal window/tab** (keep backend running in the first one).

#### 4.1 Navigate to project root
```bash
# If you're still in backend folder, go back
cd ..

# You should now be in the project root folder
pwd    # Should show: /path/to/project
```

#### 4.2 Install frontend dependencies
```bash
npm install
```

This will install Next.js and all frontend packages (may take 2-3 minutes).

#### 4.3 Start the frontend development server

```bash
npm run dev
```

You should see:
```
▲ Next.js 13.5.1
- Local:        http://localhost:3000
- ready in 2.5s
```

✅ **Frontend is running!**

---

## 🎉 Access the Application

Now you can access the application:

### Main Application
**URL:** http://localhost:3000

### Login Credentials

**Default Admin User:**
- Email: `admin@bitcoinira.com`
- Password: `Admin123!`

### Available Pages

- **Home:** http://localhost:3000
- **Login:** http://localhost:3000/auth/login
- **Sign Up:** http://localhost:3000/auth/signup
- **Dashboard:** http://localhost:3000/dashboard (after login)
- **Admin Panel:** http://localhost:3000/admin (admin only)

### API Endpoints
**Base URL:** http://localhost:3001/api

- Health Check: http://localhost:3001/health
- Login: POST http://localhost:3001/api/auth/login
- Signup: POST http://localhost:3001/api/auth/signup

---

## 📝 Summary: What's Running

You should have **2 terminal windows open:**

### Terminal 1 - Backend (Port 3001)
```
backend/
$ npm run start:dev
🚀 Bitcoin IRA Platform API (NestJS) running on port 3001
```

### Terminal 2 - Frontend (Port 3000)
```
project/
$ npm run dev
▲ Next.js 13.5.1
- Local: http://localhost:3000
```

---

## 🛑 Stopping the Application

To stop the servers:

1. Go to each terminal window
2. Press `Ctrl + C` (Windows/Linux) or `Cmd + C` (macOS)

---

## 🔄 Starting Again Later

When you want to run the application again:

### Start Backend:
```bash
cd backend
npm run start:dev
```

### Start Frontend (in a new terminal):
```bash
cd project-root
npm run dev
```

---

## 🧪 Testing the Setup

### Test Backend API

```bash
# Health check
curl http://localhost:3001/health

# Login as admin
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bitcoinira.com","password":"Admin123!"}'
```

### Test Frontend

1. Open browser: http://localhost:3000
2. Click "Login"
3. Enter admin credentials
4. You should see the dashboard

---

## ❌ Common Issues & Solutions

### Issue 1: Port Already in Use

**Error:** `Port 3000 is already in use` or `Port 3001 is already in use`

**Solution:**

```bash
# Find process using the port (macOS/Linux)
lsof -ti:3000    # or :3001
kill -9 $(lsof -ti:3000)

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

Or change the port in `.env` (backend) or run frontend on different port:
```bash
PORT=3005 npm run dev
```

---

### Issue 2: Database Connection Failed

**Error:** `Error: connect ECONNREFUSED` or `password authentication failed`

**Solution:**

1. Check PostgreSQL is running:
   ```bash
   pg_isready
   ```

2. If not running, start it:
   ```bash
   # macOS
   brew services start postgresql@15

   # Linux
   sudo systemctl start postgresql

   # Windows - use Services app
   ```

3. Check password in `backend/.env` is correct

4. Test database connection:
   ```bash
   psql -U postgres -d bitcoin_ira -c "SELECT NOW();"
   ```

---

### Issue 3: Database Does Not Exist

**Error:** `database "bitcoin_ira" does not exist`

**Solution:**
```bash
psql -U postgres -c "CREATE DATABASE bitcoin_ira;"
cd backend
npm run migrate
```

---

### Issue 4: Migration Fails

**Error during migration**

**Solution:**

1. Check database exists
2. Check PostgreSQL is running
3. Reset and try again:
   ```bash
   # ⚠️ This deletes all data!
   psql -U postgres -c "DROP DATABASE bitcoin_ira;"
   psql -U postgres -c "CREATE DATABASE bitcoin_ira;"
   npm run migrate
   ```

---

### Issue 5: npm install fails

**Error:** `npm ERR!` during installation

**Solution:**

1. Clear npm cache:
   ```bash
   npm cache clean --force
   ```

2. Delete node_modules and package-lock.json:
   ```bash
   rm -rf node_modules package-lock.json
   ```

3. Install again:
   ```bash
   npm install
   ```

---

### Issue 6: Cannot login

**Error:** "Invalid credentials"

**Solutions:**

1. Make sure backend is running (check http://localhost:3001/health)

2. Verify admin user exists:
   ```bash
   psql -U postgres -d bitcoin_ira -c "SELECT email FROM users WHERE role='admin';"
   ```

3. If no admin user, run migrations again:
   ```bash
   cd backend
   npm run migrate
   ```

---

## 📊 Checking Database

To view your database:

```bash
# Connect to database
psql -U postgres -d bitcoin_ira

# Inside psql:
\dt                           # List all tables
SELECT * FROM users;          # View users
SELECT * FROM portfolios;     # View portfolios
\q                            # Exit
```

---

## 🔧 Useful Commands

### Backend Commands
```bash
npm run start:dev     # Start development server
npm run build         # Build for production
npm run start         # Start production server
npm run migrate       # Run database migrations
```

### Frontend Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Check code quality
```

---

## 📁 Project Structure

```
project/
├── backend/                  # Backend API (NestJS)
│   ├── migrations/          # Database migrations
│   ├── src/                 # Source code
│   ├── .env                 # Environment variables
│   └── package.json         # Backend dependencies
├── app/                     # Frontend pages (Next.js)
├── components/              # React components
├── lib/                     # Utilities
├── public/                  # Static files
└── package.json            # Frontend dependencies
```

---

## 📚 Additional Documentation

- **[backend/DATABASE_SETUP.md](backend/DATABASE_SETUP.md)** - Detailed database setup guide
- **[backend/README.md](backend/README.md)** - Backend API documentation
- **[POSTGRESQL_MIGRATION_COMPLETE.md](POSTGRESQL_MIGRATION_COMPLETE.md)** - Migration details

---

## ✅ Quick Checklist

Before running the app, verify:

- [ ] PostgreSQL installed and running
- [ ] Database `bitcoin_ira` created
- [ ] `backend/.env` file configured with correct password
- [ ] Backend dependencies installed (`cd backend && npm install`)
- [ ] Database migrations run (`cd backend && npm run migrate`)
- [ ] Frontend dependencies installed (`npm install` in project root)

---

## 🎯 Next Steps

After getting the app running:

1. ✅ Login with admin credentials
2. ✅ Explore the dashboard
3. ✅ Create a test investor account
4. ✅ Test transactions and documents
5. ✅ Review API endpoints in backend/README.md

---

## 🆘 Need Help?

If you encounter issues:

1. Check PostgreSQL is running: `pg_isready`
2. Check backend is running: `curl http://localhost:3001/health`
3. Check frontend is running: Open http://localhost:3000
4. Review error messages in terminal
5. Check the troubleshooting section above

---

**Last Updated:** 2024-11-18
**System Requirements:** Node.js 16+, PostgreSQL 12+
**Platform:** Windows, macOS, Linux
