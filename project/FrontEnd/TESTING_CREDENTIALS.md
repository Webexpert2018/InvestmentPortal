# Testing Credentials for Bitcoin IRA Platform

## 🔐 Dummy User Accounts

Use these credentials to test the platform:

### 1. Investor Account (Regular User)

```
Email:    investor@test.com
Password: Password123!
Role:     investor
Status:   active
```

**Portfolio Data:**
- Bitcoin Balance: 0.5 BTC
- Portfolio Value (NAV): $45,000
- Total Invested: $40,000
- Performance: 12.5% gain
- IRA Account: Traditional IRA

**What to Test:**
- ✅ Login to dashboard
- ✅ View portfolio summary
- ✅ See transaction history
- ✅ Upload documents
- ✅ View IRA account details
- ❌ Cannot access admin panel

### 2. Admin Account (Administrator)

```
Email:    admin@test.com
Password: Password123!
Role:     admin
Status:   active
```

**Admin Capabilities:**
- View all users
- Manage user accounts
- Verify documents
- View all portfolios
- View all transactions
- Generate compliance reports
- Update NAV values
- View audit logs

**What to Test:**
- ✅ Login to admin panel
- ✅ View user management dashboard
- ✅ See platform statistics
- ✅ Access all admin features
- ✅ View audit logs
- ❌ Does not have personal portfolio

---

## 📱 2-Factor Authentication (2FA) Status

### ❌ **NOT IMPLEMENTED**

2FA/MFA was **not included** in the current implementation. The platform uses:

✅ **JWT-based authentication** (token expires in 7 days)
✅ **Bcrypt password hashing** (10 rounds)
✅ **Role-based access control** (investor/admin)
✅ **Protected routes** (frontend guards)
✅ **Audit logging** (all actions tracked)

### Why 2FA Was Not Included:

1. **Not in Original 7-Phase Spec** - The architectural plan focused on JWT auth
2. **Additional Complexity** - Would require:
   - OTP generation library
   - SMS/Email service integration
   - QR code generation for authenticator apps
   - Additional database tables
   - Recovery codes system
3. **Backend Dependencies** - Would need services like Twilio (SMS) or SendGrid (Email)

### 🔧 To Add 2FA (Future Enhancement):

If you want to add 2FA, here's what needs to be implemented:

**Database Changes:**
```sql
-- Add 2FA columns to users table
ALTER TABLE users
ADD COLUMN two_factor_enabled boolean DEFAULT false,
ADD COLUMN two_factor_secret text,
ADD COLUMN two_factor_backup_codes text[];
```

**Backend Dependencies:**
```bash
npm install speakeasy qrcode otpauth
```

**Implementation Steps:**
1. Generate TOTP secrets using `speakeasy`
2. Create QR codes for authenticator apps
3. Add verification endpoints (enable/disable/verify)
4. Modify login flow to check 2FA status
5. Generate and store backup codes
6. Update frontend with 2FA setup UI

---

## 🧪 Testing the Application

### Backend Testing (Port 3001)

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test signup
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@test.com",
    "password": "SecurePass123!",
    "firstName": "New",
    "lastName": "User"
  }'

# Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "investor@test.com",
    "password": "Password123!"
  }'

# Test protected endpoint (use token from login)
curl http://localhost:3001/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Frontend Testing (Port 3000)

1. **Landing Page**: Navigate to `http://localhost:3000`
2. **Login**: Click "Sign In" and use credentials above
3. **Dashboard**: After login, explore investor dashboard
4. **Admin**: Login with admin credentials to see admin panel

---

## 🔒 Security Notes

### Current Security Features:

✅ **Password Requirements:**
- Minimum 8 characters
- Validated on backend with Zod

✅ **Token Security:**
- JWT tokens expire after 7 days
- Tokens stored in localStorage
- Tokens validated on every request

✅ **Database Security:**
- Row Level Security (RLS) enabled
- Users can only access their own data
- Admins have elevated permissions
- All policies enforced at database level

✅ **Audit Trail:**
- All critical actions logged
- User ID, action type, and timestamp recorded
- Immutable audit log (insert-only)

### Security Recommendations for Production:

1. **Change Default Passwords** - Never use Password123! in production
2. **Use Strong JWT Secret** - Generate cryptographically secure secret
3. **Enable HTTPS** - Always use SSL/TLS in production
4. **Rate Limiting** - Add request rate limiting
5. **Refresh Tokens** - Implement refresh token rotation
6. **Session Management** - Add session timeout and renewal
7. **2FA** - Implement two-factor authentication
8. **Password Policy** - Enforce stronger password requirements
9. **IP Whitelisting** - Consider IP restrictions for admin access
10. **Security Headers** - Add helmet.js for security headers

---

## 📊 Database Access

The database has been pre-populated with:
- ✅ 2 test users (investor + admin)
- ✅ 2 portfolios created
- ✅ 1 sample transaction
- ✅ 1 IRA account
- ✅ All tables with RLS enabled

You can verify by connecting to Supabase dashboard or using SQL:

```sql
SELECT email, role, status FROM users;
SELECT user_id, bitcoin_balance, nav FROM portfolios;
SELECT type, amount, status FROM transactions;
```

---

## 🚀 Quick Start Testing Workflow

1. **Start Backend:**
   ```bash
   cd backend
   npm install
   npm run start:dev
   ```

2. **Start Frontend:**
   ```bash
   npm run dev
   ```

3. **Test Investor Flow:**
   - Go to http://localhost:3000
   - Click "Sign In"
   - Login with investor@test.com / Password123!
   - Explore dashboard, view portfolio, check transactions

4. **Test Admin Flow:**
   - Logout from investor account
   - Login with admin@test.com / Password123!
   - Access admin panel
   - View user management, statistics

---

**Last Updated**: 2024-11-18
**Platform Version**: 1.0.0
**2FA Status**: ❌ Not Implemented
