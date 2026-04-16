# Bank Accounts Role Fix TODO

## Steps:
- [ ] 1. Update controller to pass full user to service
- [ ] 2. Update service to use user.role for account role, filter by user_id
- [ ] 3. Build & restart server
- [ ] 4. Test admin/investor add (role correct, only own accounts show)
- [ ] 5. Clean up TODO

**Note:** Each user sees only own accounts (already via user_id=$1).
