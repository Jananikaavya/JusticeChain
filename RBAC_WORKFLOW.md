# Role-Based Access Control (RBAC) Workflow

## 📋 Overview

Justice Chain implements a **Role-Based Access Control (RBAC)** system with 5 distinct roles:
1. **ADMIN** - System administrator
2. **POLICE** - Police officers filing cases
3. **LAWYER** - Legal professionals
4. **FORENSIC** - Forensic officers analyzing evidence
5. **JUDGE** - Judges reviewing and providing verdicts

---

## 🔐 How It Works

### 1. **Registration**
```
User → Registers with Role Selection → System stores role in Database
```

**File:** `src/pages/Register.jsx`
- User selects one of 5 roles during registration
- Backend creates user with that role in MongoDB
- Role ID is generated and sent via email

### 2. **Login**
```
User → Enters credentials → Backend validates → Returns user data with role → Frontend redirects to dashboard
```

**File:** `src/pages/Login.jsx`
- User logs in with email and password
- Backend verifies credentials
- Returns user object with role field
- Frontend redirects based on role:
  - ADMIN → `/dashboard/admin`
  - POLICE → `/dashboard/police`
  - LAWYER → `/dashboard/lawyer`
  - FORENSIC → `/dashboard/forensic`
  - JUDGE → `/dashboard/judge`

### 3. **Protected Routes**
```
User visits /dashboard/[role] → ProtectedRoute checks role → If match, show dashboard; else redirect to login
```

**File:** `src/components/ProtectedRoute.jsx`

```javascript
function ProtectedRoute({ children, allowedRole }) {
  const session = getSession(); // Get stored session
  
  // Check if user is logged in
  if (!session || !session.token) {
    return <Navigate to="/login" />;
  }
  
  // Check if user has the required role
  if (session.role !== allowedRole) {
    return <Navigate to="/" />;
  }
  
  // User is authenticated and has correct role
  return children;
}
```

### 4. **Session Management**
```
Login → Store in localStorage → Any page reads from localStorage → User stays logged in
```

**File:** `src/utils/auth.js`
- `setSession()` - Store user data after login
- `getSession()` - Retrieve user data from localStorage
- `clearSession()` - Remove user data on logout

---

## 🎯 Key Components

### Authentication Flow Diagram
```
┌─────────────────┐
│   Registration  │
│   (Select Role) │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   Login Page    │
│  (Verify Creds) │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────┐
│  ProtectedRoute Component   │
│  (Verify Role & Token)      │
└────────┬────────────────────┘
         │
         ├─→ ADMIN → AdminDashboard
         ├─→ POLICE → PoliceDashboard
         ├─→ LAWYER → LawyerDashboard
         ├─→ FORENSIC → ForensicDashboard
         └─→ JUDGE → JudgeDashboard
```

---

## 📂 File Structure

```
src/
├── pages/
│   ├── Login.jsx                 # Login form & redirection
│   ├── Register.jsx              # Registration with role selection
│   ├── AdminDashboard.jsx        # Admin role dashboard
│   ├── PoliceDashboard.jsx       # Police role dashboard
│   ├── LawyerDashboard.jsx       # Lawyer role dashboard
│   ├── ForensicDashboard.jsx     # Forensic role dashboard
│   └── JudgeDashboard.jsx        # Judge role dashboard
├── components/
│   ├── ProtectedRoute.jsx        # Role-based route guard
│   └── DashboardSwitcher.jsx     # (NEW) Test all dashboards
└── utils/
    └── auth.js                   # Session management

backend/
└── models/
    └── User.js                   # User schema with role enum
```

---

## 🔄 Workflow Example

### Scenario: Police Officer Files a Case

1. **Register as POLICE**
   - Go to `/register`
   - Fill form with POLICE role
   - Email receives Role ID

2. **Login as POLICE**
   - Go to `/login`
   - Enter credentials + Role ID
   - Redirected to `/dashboard/police`

3. **Access Check**
   ```javascript
   // ProtectedRoute checks:
   - Is user logged in? ✓ (has token)
   - Does role match? ✓ (POLICE === allowedRole)
   - Show PoliceDashboard ✓
   ```

4. **File a Case**
   - Use PoliceDashboard to create case
   - API call: `POST /api/cases/create`
   - Case stored in MongoDB

### Scenario: Judge Reviews Case

1. **Judge Logs In**
   - Email + Password + Role ID
   - Redirected to `/dashboard/judge`

2. **View Assigned Cases**
   - API call: `GET /api/cases/my-cases`
   - Only shows cases assigned to this judge

3. **Provide Verdict**
   - Review evidence chain
   - Submit verdict
   - Case marked as CLOSED on blockchain

---

## 🧪 Testing All Dashboards

### Method 1: Register Multiple Test Accounts
```
1. Register as ADMIN (if allowed)
2. Register as POLICE
3. Register as LAWYER
4. Register as FORENSIC
5. Register as JUDGE
```

Then login to each account to test the workflow.

### Method 2: Use DashboardSwitcher Component (NEW)
Add to any dashboard:
```jsx
import DashboardSwitcher from '../components/DashboardSwitcher';

export default function Dashboard() {
  return (
    <>
      <DashboardSwitcher />
      {/* Your dashboard content */}
    </>
  );
}
```

This provides a quick switcher to jump between dashboards while testing.

---

## 🛡️ Security Features

1. **Token Validation**
   - JWT token stored in localStorage
   - Sent with every API request
   - Backend validates token

2. **Role Verification**
   - ProtectedRoute checks role before rendering
   - Backend API also validates role for each action

3. **Session Persistence**
   - Stays logged in even after page refresh
   - Logout clears session completely

---

## 🚀 Backend Integration

### User Model (MongoDB)
```javascript
{
  username: String,
  email: String,
  password: String (hashed),
  role: ['ADMIN', 'POLICE', 'LAWYER', 'FORENSIC', 'JUDGE'],
  roleId: String (unique),
  wallet: String,
  createdAt: Date
}
```

### API Endpoints
```
POST   /api/auth/register        # Create user with role
POST   /api/auth/login           # Authenticate and return role
GET    /api/cases/my-cases       # Role-specific cases
POST   /api/cases/create         # Role-specific action
POST   /api/cases/:id/verdict    # Judge-only action
```

---

## ✅ Checklist: Implementing RBAC

- [x] Define roles (ADMIN, POLICE, LAWYER, FORENSIC, JUDGE)
- [x] Add role field to User model
- [x] Create registration with role selection
- [x] Create login with role-based redirect
- [x] Create ProtectedRoute component
- [x] Create separate dashboards for each role
- [x] Implement session management (localStorage)
- [x] Add API token validation
- [x] Backend role verification on endpoints
- [x] Add logout functionality
- [x] Create DashboardSwitcher for testing

---

## 📝 Key Takeaways

**How Users Access Dashboards:**
1. Register with their specific role
2. Login with credentials + role ID
3. Frontend redirects to role-specific dashboard
4. ProtectedRoute prevents unauthorized access
5. Session persists until logout

**Why This Works:**
- Each role sees only relevant information
- API requests validated on backend
- Clear separation of concerns
- Secure and scalable design
