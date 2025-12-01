#!/bin/bash

echo "🔍 Bitcoin IRA Platform - Login Diagnostic Tool"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check PostgreSQL
echo "1️⃣  Checking PostgreSQL..."
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL is installed${NC}"

    if pg_isready -U postgres &> /dev/null; then
        echo -e "${GREEN}✅ PostgreSQL is running${NC}"
    else
        echo -e "${RED}❌ PostgreSQL is not running${NC}"
        echo "   Run: brew services start postgresql@15  (macOS)"
        echo "   Run: sudo systemctl start postgresql   (Linux)"
    fi
else
    echo -e "${RED}❌ PostgreSQL is not installed${NC}"
    echo "   Install: brew install postgresql@15  (macOS)"
    echo "   Install: sudo apt install postgresql  (Linux)"
fi
echo ""

# Test 2: Check if database exists
echo "2️⃣  Checking database..."
if command -v psql &> /dev/null; then
    if psql -U postgres -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw bitcoin_ira; then
        echo -e "${GREEN}✅ Database 'bitcoin_ira' exists${NC}"

        # Check if users exist
        USER_COUNT=$(psql -U postgres -d bitcoin_ira -tAc "SELECT COUNT(*) FROM users;" 2>/dev/null)
        if [ "$USER_COUNT" -gt 0 ]; then
            echo -e "${GREEN}✅ Found $USER_COUNT user(s) in database${NC}"
            psql -U postgres -d bitcoin_ira -c "SELECT email, role, status FROM users LIMIT 5;" 2>/dev/null
        else
            echo -e "${YELLOW}⚠️  No users found in database${NC}"
            echo "   Run: cd backend && npm run migrate"
        fi
    else
        echo -e "${RED}❌ Database 'bitcoin_ira' does not exist${NC}"
        echo "   Run: psql -U postgres -c \"CREATE DATABASE bitcoin_ira;\""
    fi
else
    echo -e "${YELLOW}⏭️  Skipping (PostgreSQL not available)${NC}"
fi
echo ""

# Test 3: Check backend .env
echo "3️⃣  Checking backend configuration..."
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✅ backend/.env exists${NC}"
    if grep -q "DB_PASSWORD" backend/.env; then
        echo -e "${GREEN}✅ Database password configured${NC}"
    fi
else
    echo -e "${RED}❌ backend/.env does not exist${NC}"
    echo "   Run: cp backend/.env.example backend/.env"
fi
echo ""

# Test 4: Check frontend .env
echo "4️⃣  Checking frontend configuration..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env exists${NC}"
    if grep -q "NEXT_PUBLIC_API_URL" .env; then
        API_URL=$(grep "NEXT_PUBLIC_API_URL" .env | cut -d '=' -f 2)
        echo -e "${GREEN}✅ API URL configured: $API_URL${NC}"
    else
        echo -e "${RED}❌ API URL not configured${NC}"
        echo "   Add: NEXT_PUBLIC_API_URL=http://localhost:3001/api"
    fi
else
    echo -e "${RED}❌ .env does not exist${NC}"
fi
echo ""

# Test 5: Check if backend is running
echo "5️⃣  Checking backend server..."
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running on port 3001${NC}"
    curl -s http://localhost:3001/health | grep -q "ok" && echo -e "${GREEN}✅ Backend health check passed${NC}"
else
    echo -e "${RED}❌ Backend is not running${NC}"
    echo "   Run: cd backend && npm run start:dev"
fi
echo ""

# Test 6: Check if frontend is running
echo "6️⃣  Checking frontend server..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is running on port 3000${NC}"
else
    echo -e "${RED}❌ Frontend is not running${NC}"
    echo "   Run: npm run dev"
fi
echo ""

# Test 7: Test login API
echo "7️⃣  Testing login API..."
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@bitcoinira.com","password":"Admin123!"}' 2>&1)

    if echo "$RESPONSE" | grep -q "token"; then
        echo -e "${GREEN}✅ Login API works! Admin user exists${NC}"
    else
        echo -e "${RED}❌ Login failed${NC}"
        echo "Response: $RESPONSE"
        echo ""
        echo "   Possible fixes:"
        echo "   - Run migrations: cd backend && npm run migrate"
        echo "   - Check admin user exists in database"
    fi
else
    echo -e "${YELLOW}⏭️  Skipping (Backend not running)${NC}"
fi
echo ""

# Summary
echo "================================================"
echo "📋 Summary"
echo "================================================"
echo ""
echo "To login successfully, you need:"
echo "1. ✓ PostgreSQL installed and running"
echo "2. ✓ Database 'bitcoin_ira' created"
echo "3. ✓ Migrations run (creates admin user)"
echo "4. ✓ backend/.env configured"
echo "5. ✓ Backend running on port 3001"
echo "6. ✓ Frontend running on port 3000"
echo ""
echo "Default login credentials:"
echo "  Email: admin@bitcoinira.com"
echo "  Password: Admin123!"
echo ""
echo "For detailed help, see: LOGIN_HELP.md"
