# 🚀 How to Run - Simple Guide

## Quick 5-Step Setup

### 1️⃣ Install PostgreSQL

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Windows:** Download from https://www.postgresql.org/download/windows/

**Linux:**
```bash
sudo apt install postgresql
sudo systemctl start postgresql
```

---

### 2️⃣ Create Database

```bash
psql -U postgres -c "CREATE DATABASE bitcoin_ira;"
```

---

### 3️⃣ Setup Backend

```bash
# Go to backend folder
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env - add your PostgreSQL password!

# Run migrations
npm run migrate

# Start backend
npm run start:dev
```

✅ Backend running at: http://localhost:3001

---

### 4️⃣ Setup Frontend

**Open a NEW terminal:**

```bash
# Go to project root (not backend folder)
cd ..

# Install dependencies
npm install

# Start frontend
npm run dev
```

✅ Frontend running at: http://localhost:3000

---

### 5️⃣ Login & Use

Open browser: http://localhost:3000/auth/login

**Default Admin:**
- Email: `admin@bitcoinira.com`
- Password: `Admin123!`

---

## 📺 What You Should See

### Terminal 1 (Backend):
```
🚀 Bitcoin IRA Platform API (NestJS) running on port 3001
```

### Terminal 2 (Frontend):
```
▲ Next.js 13.5.1
- Local: http://localhost:3000
```

---

## 🔄 Running Again Later

**Backend (Terminal 1):**
```bash
cd backend
npm run start:dev
```

**Frontend (Terminal 2):**
```bash
npm run dev
```

---

## 🛑 Stop the App

Press `Ctrl + C` in both terminals

---

## ❌ Common Problems

### "Port already in use"
```bash
# Kill process on port 3001 (backend)
lsof -ti:3001 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

### "Database connection failed"
```bash
# Check PostgreSQL is running
pg_isready

# Start it if needed
brew services start postgresql@15    # macOS
sudo systemctl start postgresql      # Linux
```

### "Cannot login"
- Make sure backend is running (check http://localhost:3001/health)
- Check password in `backend/.env` matches your PostgreSQL password
- Run migrations: `cd backend && npm run migrate`

---

## 📋 File Locations

```
project/
├── backend/              ← Backend code
│   ├── .env             ← Database password goes here
│   └── migrations/      ← Database setup
├── app/                 ← Frontend pages
└── components/          ← UI components
```

---

## 🎯 URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| Health Check | http://localhost:3001/health |
| Login Page | http://localhost:3000/auth/login |
| Dashboard | http://localhost:3000/dashboard |

---

## 📚 More Help

- **Detailed Setup:** See [QUICK_START_GUIDE.md](QUICK_START_GUIDE.md)
- **Database Guide:** See [backend/DATABASE_SETUP.md](backend/DATABASE_SETUP.md)
- **Backend API:** See [backend/README.md](backend/README.md)

---

**Need help?** Check the terminal for error messages!
