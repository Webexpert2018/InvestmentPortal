# 🔐 Login Help Guide

## Current Issue

The application requires:
1. **Backend API** running on `http://localhost:3001`
2. **PostgreSQL database** with user accounts
3. **Frontend** running on `http://localhost:3000`

## ✅ Quick Fix - Step by Step

### Step 1: Check if PostgreSQL is Installed

```bash
psql --version
```

**If not installed:**

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download from: https://www.postgresql.org/download/windows/

---

### Step 2: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Inside psql, run:
CREATE DATABASE bitcoin_ira;

# Exit psql
\q
```

---

### Step 3: Configure Backend

The backend `.env` file has been created at `backend/.env`.

**If your PostgreSQL password is different**, edit `backend/.env`:

```bash
# Edit this file
nano backend/.env   # or use your favorite editor

# Change this line if needed:
DB_PASSWORD=your_actual_postgres_password
```

---

### Step 4: Install Backend Dependencies & Run Migrations

```bash
cd backend

# Install dependencies (if not already done)
npm install

# Run database migrations (creates tables and admin user)
npm run migrate
```

**You should see:**
```
🔄 Connecting to database...
📂 Found 1 migration file(s):
   ✅ Completed: 001_initial_schema.sql
✅ All migrations completed successfully!
```

---

### Step 5: Start Backend

```bash
# In the backend folder
npm run start:dev
```

**Wait for:**
```
🚀 Bitcoin IRA Platform API (NestJS) running on port 3001
```

**Keep this terminal open!**

---

### Step 6: Start Frontend (New Terminal)

Open a **NEW terminal window** and run:

```bash
# From project root (not backend folder!)
npm run dev
```

**Wait for:**
```
▲ Next.js 13.5.1
- Local: http://localhost:3000
```

---

### Step 7: Login!

1. **Open browser:** http://localhost:3000/auth/login

2. **Enter credentials:**
   ```
   Email: admin@bitcoinira.com
   Password: Admin123!
   ```

3. **Click "Login"**

4. **You should see:** Dashboard with sidebar menu!

---

## 🎯 Default Login Credentials

After running migrations, use these credentials:

```
Email: admin@bitcoinira.com
Password: Admin123!
Role: Admin
```

---

## 🔍 Testing Backend Connection

### Test 1: Health Check

```bash
curl http://localhost:3001/health
```

**Expected:**
```json
{"status":"ok","timestamp":"...","framework":"NestJS"}
```

### Test 2: Check Database User

```bash
psql -U postgres -d bitcoin_ira -c "SELECT email, role, status FROM users;"
```

**Expected:**
```
         email          | role  | status
------------------------+-------+--------
admin@bitcoinira.com    | admin | active
```

### Test 3: Test Login API

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bitcoinira.com","password":"Admin123!"}'
```

**Expected:** JSON with user data and token

---

## ❌ Common Errors & Solutions

### Error: "Cannot connect to database"

**Cause:** PostgreSQL not running or wrong credentials

**Fix:**
```bash
# Check PostgreSQL status
pg_isready

# If not running:
brew services start postgresql@15    # macOS
sudo systemctl start postgresql      # Linux
```

### Error: "Database 'bitcoin_ira' does not exist"

**Fix:**
```bash
psql -U postgres -c "CREATE DATABASE bitcoin_ira;"
cd backend
npm run migrate
```

### Error: "Invalid credentials" when logging in

**Cause:** User doesn't exist or migrations didn't run

**Fix:**
```bash
cd backend
npm run migrate

# Verify user was created
psql -U postgres -d bitcoin_ira -c "SELECT * FROM users WHERE email='admin@bitcoinira.com';"
```

### Error: Frontend shows "Network Error"

**Cause:** Backend not running or wrong API URL

**Fix:**
1. Check backend is running: `curl http://localhost:3001/health`
2. Check `.env` has: `NEXT_PUBLIC_API_URL=http://localhost:3001/api`
3. Restart frontend: `npm run dev`

### Error: "Cannot find module" in backend

**Fix:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm run start:dev
```

---

## 📋 Complete Checklist

Before attempting to login, verify:

- [ ] PostgreSQL is installed and running
- [ ] Database `bitcoin_ira` exists
- [ ] Backend `.env` file exists with correct DB password
- [ ] Backend dependencies installed (`cd backend && npm install`)
- [ ] Migrations have run successfully (`cd backend && npm run migrate`)
- [ ] Backend is running on port 3001 (terminal shows "running on port 3001")
- [ ] Frontend `.env` has `NEXT_PUBLIC_API_URL=http://localhost:3001/api`
- [ ] Frontend is running on port 3000 (terminal shows "Local: http://localhost:3000")

---

## 🎬 Complete Fresh Start

If nothing works, start from scratch:

```bash
# 1. Stop all servers (Ctrl+C in all terminals)

# 2. Create database
psql -U postgres -c "DROP DATABASE IF EXISTS bitcoin_ira;"
psql -U postgres -c "CREATE DATABASE bitcoin_ira;"

# 3. Setup backend
cd backend
npm install
cp .env.example .env
# Edit .env with your PostgreSQL password if needed
npm run migrate
npm run start:dev

# 4. In NEW terminal, setup frontend
cd ..
npm install
npm run dev

# 5. Open browser: http://localhost:3000/auth/login
# 6. Login with: admin@bitcoinira.com / Admin123!
```

---

## 🆘 Still Having Issues?

Check these files for proper configuration:

1. **`backend/.env`** - Database credentials
2. **`.env`** (project root) - API URL for frontend
3. **Backend terminal** - Look for startup errors
4. **Frontend terminal** - Look for compilation errors
5. **Browser console** (F12) - Look for network/JavaScript errors

---

## 📞 Quick Debug Commands

```bash
# Check PostgreSQL
psql --version
pg_isready

# Check database
psql -U postgres -l | grep bitcoin_ira

# Check users in database
psql -U postgres -d bitcoin_ira -c "SELECT * FROM users;"

# Check backend health
curl http://localhost:3001/health

# Check if ports are in use
lsof -i :3000    # Frontend
lsof -i :3001    # Backend
```

---

**Once everything is running, you'll see the beautiful sidebar menu with role-based navigation!** 🎉
