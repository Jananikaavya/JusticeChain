# 🧪 Testing All 5 Roles - Quick Guide

## What You Need

- Backend running: `npm run dev` (in backend folder)
- Frontend running: `npm run dev` (in project root)
- Browser at: `http://localhost:5173`

---

## Step-by-Step Testing

### 1. **Test ADMIN Role**
```
1. Go to /register
2. Fill form:
   - Username: admin_test
   - Email: admin@example.com
   - Password: Test@123
   - Role: Admin
3. Click Register
4. Go to /login
5. Enter credentials
6. Should redirect to /dashboard/admin ✓
7. You see: Admin Dashboard with system info
```

### 2. **Test POLICE Role**
```
1. Go to /register
2. Fill form:
   - Username: police_test
   - Email: police@example.com
   - Password: Test@123
   - Role: Police
3. Click Register
4. Go to /login
5. Enter credentials
6. Should redirect to /dashboard/police ✓
7. You see: Police Dashboard with "Create Case" option
```

### 3. **Test LAWYER Role**
```
1. Go to /register
2. Fill form:
   - Username: lawyer_test
   - Email: lawyer@example.com
   - Password: Test@123
   - Role: Lawyer
3. Click Register
4. Go to /login
5. Enter credentials
6. Should redirect to /dashboard/lawyer ✓
7. You see: Lawyer Dashboard with case list
```

### 4. **Test FORENSIC Role**
```
1. Go to /register
2. Fill form:
   - Username: forensic_test
   - Email: forensic@example.com
   - Password: Test@123
   - Role: Forensic Officer
3. Click Register
4. Go to /login
5. Enter credentials
6. Should redirect to /dashboard/forensic ✓
7. You see: Forensic Dashboard with evidence analysis
```

### 5. **Test JUDGE Role**
```
1. Go to /register
2. Fill form:
   - Username: judge_test
   - Email: judge@example.com
   - Password: Test@123
   - Role: Judge
3. Click Register
4. Go to /login
5. Enter credentials
6. Should redirect to /dashboard/judge ✓
7. You see: Judge Dashboard with case review
```

---

## 🔄 Understanding the Workflow

### When You Login:
```
Email + Password + Role ID
        ↓
  Backend validates
        ↓
  Returns user object with ROLE
        ↓
  Frontend stores in localStorage
        ↓
  Frontend redirects to /dashboard/{role}
        ↓
  ProtectedRoute checks if role matches
        ↓
  If YES → Shows dashboard
  If NO → Redirects to login
```

### Key Files Involved:
- **src/pages/Login.jsx** - Handles login & redirect logic
- **src/pages/Register.jsx** - Role selection during registration
- **src/components/ProtectedRoute.jsx** - Protects dashboards
- **src/utils/auth.js** - Manages session (localStorage)

---

## 🎯 Testing Tips

### Test Role Restriction
```
1. Login as POLICE
2. Go to URL: http://localhost:5173/dashboard/judge
3. Should redirect to login (role doesn't match) ✓
```

### Test Session Persistence
```
1. Login as ADMIN
2. Refresh page (F5)
3. Should stay on /dashboard/admin ✓
```

### Test Logout
```
1. Login as any role
2. Click Logout button
3. Should go to login page ✓
4. Session should be cleared
```

### Test Invalid Credentials
```
1. Go to /login
2. Enter wrong password
3. Should show error message ✓
```

---

## 📊 Workflow Summary

```
REGISTRATION             LOGIN              DASHBOARD
    ↓                     ↓                      ↓
Select Role → Email/Pass → Validate → Redirect to → ProtectedRoute
   (5 options)            (Creds)    Role-Specific   (Check role)
                                     Dashboard         ✓ Access
                                                      ✗ Deny
```

---

## ❓ Common Issues

**Problem:** Getting redirected to login after login
- **Solution:** Role selected during registration doesn't match route
- Check: Is role correct in database?

**Problem:** Dashboard shows wrong information
- **Solution:** API might be fetching all data, not role-specific
- Check: Backend API filters by user role

**Problem:** Session lost after refresh
- **Solution:** localStorage might be cleared
- Check: Browser privacy settings

---

## 🎓 What You're Testing

✅ **Authentication** - Login works correctly
✅ **Authorization** - Users see only their role's dashboard
✅ **Session** - User stays logged in after refresh
✅ **Route Protection** - Can't access other role's dashboard
✅ **Data Isolation** - Each role sees different data

This is **Role-Based Access Control (RBAC)** in action! 🔐
