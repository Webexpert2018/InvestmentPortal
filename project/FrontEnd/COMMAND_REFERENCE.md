# 📋 Command Reference

Quick reference for running the Bitcoin IRA Platform.

## 🎯 First Time Setup

```bash
# 1. Create database
psql -U postgres -c "CREATE DATABASE bitcoin_ira;"

# 2. Setup backend
cd backend
npm install
cp .env.example .env
# Edit .env with your password!
npm run migrate
npm run start:dev

# 3. Setup frontend (NEW TERMINAL)
cd ..
npm install
npm run dev
```

---

## 🔄 Daily Use (After Initial Setup)

### Terminal 1 - Backend
```bash
cd backend
npm run start:dev
```

### Terminal 2 - Frontend
```bash
npm run dev
```

---

## 🗄️ Database Commands

```bash
# Run migrations
cd backend
npm run migrate

# Create new migration
npm run migrate:create migration_name

# Connect to database
psql -U postgres -d bitcoin_ira

# List tables
psql -U postgres -d bitcoin_ira -c "\dt"

# View users
psql -U postgres -d bitcoin_ira -c "SELECT * FROM users;"

# Reset database (⚠️ DELETES ALL DATA)
psql -U postgres -c "DROP DATABASE bitcoin_ira;"
psql -U postgres -c "CREATE DATABASE bitcoin_ira;"
cd backend && npm run migrate
```

---

## 🧪 Testing Commands

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bitcoinira.com","password":"Admin123!"}'
```

---

## 🛑 Stop & Restart

### Stop Servers
Press `Ctrl + C` in both terminal windows

### Restart Backend
```bash
cd backend
npm run start:dev
```

### Restart Frontend
```bash
npm run dev
```

---

## ⚡ Kill Processes

```bash
# Kill backend (port 3001)
lsof -ti:3001 | xargs kill -9

# Kill frontend (port 3000)
lsof -ti:3000 | xargs kill -9

# Check PostgreSQL
pg_isready

# Start PostgreSQL
brew services start postgresql@15    # macOS
sudo systemctl start postgresql      # Linux
```

---

## 🔧 Build Commands

### Backend
```bash
cd backend
npm run build          # Build TypeScript
npm run start          # Start production
npm run start:debug    # Start with debugger
npm run lint           # Lint code
```

### Frontend
```bash
npm run build         # Build for production
npm run start         # Start production
npm run lint          # Lint code
npm run typecheck     # Type check
```

---

## 🔍 Debugging

```bash
# Check backend logs
cd backend
npm run start:dev

# Check if ports are in use
lsof -i :3000    # Frontend
lsof -i :3001    # Backend
lsof -i :5432    # PostgreSQL

# Test database connection
psql -U postgres -d bitcoin_ira -c "SELECT NOW();"

# Check migrations
psql -U postgres -d bitcoin_ira -c "SELECT * FROM migrations;"
```

---

## 📝 Environment Files

### backend/.env
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bitcoin_ira
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret
PORT=3001
```

### .env (project root)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## 🌐 URLs

| What | URL |
|------|-----|
| Frontend | http://localhost:3000 |
| Login | http://localhost:3000/auth/login |
| Dashboard | http://localhost:3000/dashboard |
| Admin | http://localhost:3000/admin |
| Backend | http://localhost:3001 |
| Health | http://localhost:3001/health |

---

## 👤 Default Login

```
Email: admin@bitcoinira.com
Password: Admin123!
```

---

## 📦 Dependencies

```bash
# Reinstall all dependencies
cd backend && npm install && cd .. && npm install

# Clear cache and reinstall
cd backend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

cd ..
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

## 🔄 Git Commands

```bash
# Check status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Your message"

# Push to remote
git push
```

---

## 📊 Monitoring

```bash
# Watch backend logs
cd backend
npm run start:dev | grep "ERROR"

# Watch PostgreSQL logs (macOS)
tail -f /usr/local/var/log/postgresql@15.log

# Check running processes
ps aux | grep node
ps aux | grep postgres
```

---

## 💾 Backup & Restore

```bash
# Backup database
pg_dump -U postgres bitcoin_ira > backup_$(date +%Y%m%d).sql

# Restore database
psql -U postgres bitcoin_ira < backup_20241118.sql
```

---

**Quick Access:**
- Setup: [HOW_TO_RUN.md](HOW_TO_RUN.md)
- Detailed Guide: [QUICK_START_GUIDE.md](QUICK_START_GUIDE.md)
- Database: [backend/DATABASE_SETUP.md](backend/DATABASE_SETUP.md)
