# 🧪 Dashboard Testing - Quick Start Guide

## ✅ Dashboard Switcher is Now Installed!

All 5 dashboards now have the **DashboardSwitcher** component in the top-right corner. This allows you to:
- See which role you're logged in as
- Quickly switch between dashboards for testing
- Logout easily

---

## 🚀 How to Test All Dashboards

### **Step 1: Register Test Accounts**

Create 5 different accounts (one for each role):

```
Repeat 5 times:
1. Go to http://localhost:5173/register
2. Fill in the form with different credentials
3. Select each role: ADMIN, POLICE, LAWYER, FORENSIC, JUDGE
4. Click Register
```

**Example Test Accounts:**
```
Admin:     admin_test / admin@test.com / Test@123
Police:    police_test / police@test.com / Test@123
Lawyer:    lawyer_test / lawyer@test.com / Test@123
Forensic:  forensic_test / forensic@test.com / Test@123
Judge:     judge_test / judge@test.com / Test@123
```

### **Step 2: Test Each Role**

```
1. Login with each account
2. Frontend redirects to role-specific dashboard
3. You should see the DashboardSwitcher in top-right corner
4. It shows your current role
```

### **Step 3: Test Dashboard Switching**

Once logged in as any role:

```
1. Look at top-right corner
2. See "Logged in as: [YOUR_ROLE]"
3. Click any dashboard button to switch
4. Dashboard updates instantly
```

---

## 🎯 What Each Dashboard Shows

### **🛡️ Admin Dashboard**
- Manage all cases in the system
- Approve pending cases
- Assign forensic officers and judges
- View system information

### **👮 Police Dashboard**
- Create new cases
- Upload evidence
- Track case status
- View assigned cases

### **⚖️ Lawyer Dashboard**
- View active cases
- Track won cases
- Manage documents
- Review case details

### **🔬 Forensic Dashboard**
- Analyze assigned evidence
- Submit forensic reports
- Review case information
- Mark evidence as analyzed

### **🏛️ Judge Dashboard**
- Review assigned cases
- Examine evidence chains
- Submit verdicts
- View case history

---

## 📊 Complete Testing Workflow

```
REGISTER ACCOUNT
        ↓
SELECT ROLE (ADMIN/POLICE/LAWYER/FORENSIC/JUDGE)
        ↓
RECEIVE ROLE ID (via email)
        ↓
LOGIN with email + password + role ID
        ↓
REDIRECTED to role's dashboard
        ↓
SEE DASHBORAD SWITCHER (top-right)
        ↓
CLICK different roles to test switching
        ↓
VERIFY data changes based on role
        ↓
LOGOUT and test another account
```

---

## 🔄 How the Switcher Works

**Location:** Top-right corner of every dashboard

**Features:**
1. **Role Display** - Shows current logged-in role
2. **Quick Links** - 5 buttons for each dashboard
3. **Auto-Update** - Buttons highlight your current role
4. **Logout Button** - Easy access to logout

**Code in each dashboard:**
```jsx
import DashboardSwitcher from "../components/DashboardSwitcher";

export default function Dashboard() {
  return (
    <div>
      <DashboardSwitcher />  {/* Added at top */}
      {/* Rest of dashboard */}
    </div>
  );
}
```

---

## ✅ Testing Checklist

- [ ] **Register as ADMIN** - Login and see Admin Dashboard
- [ ] **Register as POLICE** - Create case functionality visible
- [ ] **Register as LAWYER** - See case list for lawyer
- [ ] **Register as FORENSIC** - Evidence analysis options visible
- [ ] **Register as JUDGE** - Verdict submission visible
- [ ] **Test Switcher** - Click buttons to switch dashboards
- [ ] **Test Logout** - Logging out clears session
- [ ] **Test Role Restriction** - Can't access other roles via URL
- [ ] **Test Session Persistence** - Refresh page, stay logged in
- [ ] **Test Data Isolation** - Each role sees different data

---

## 🛠️ Files Modified

Added `DashboardSwitcher` import and component to:
- ✅ src/pages/AdminDashboard.jsx
- ✅ src/pages/PoliceDashboard.jsx
- ✅ src/pages/LawyerDashboard.jsx
- ✅ src/pages/ForensicDashboard.jsx
- ✅ src/pages/JudgeDashboard.jsx

Component created:
- ✅ src/components/DashboardSwitcher.jsx

---

## 🎓 Key Learning Points

**What You're Testing:**
1. **Role-Based Access** - Each role sees their dashboard
2. **Data Isolation** - Users see only their relevant data
3. **Session Management** - Login/logout works correctly
4. **Route Protection** - ProtectedRoute prevents unauthorized access
5. **Workflow** - Complete authentication and authorization flow

**How It Works:**
```
Register → Select Role → Login → Redirect to Dashboard → Access Controlled by Role
```

---

## 💡 Pro Tips

**Tip 1: Test in Incognito Window**
- Open new incognito window for each account
- Avoids session conflicts

**Tip 2: Use Browser DevTools**
- F12 → Application → localStorage
- See stored user data and token

**Tip 3: Check Console for Errors**
- F12 → Console
- Watch for any authentication errors

**Tip 4: Test on Mobile**
- DashboardSwitcher is responsive
- Works on all screen sizes

---

## 📝 Troubleshooting

**Problem:** Switcher doesn't appear
- **Solution:** Clear browser cache (Ctrl+Shift+Delete)
- Refresh page with Ctrl+F5

**Problem:** Can't switch dashboards
- **Solution:** Check if token is valid
- Logout and login again

**Problem:** Wrong data shown
- **Solution:** Check API is filtering by user role
- Verify backend returns role-specific data

---

**You're all set!** 🎉 Test all dashboards using the switcher in the top-right corner of each dashboard.
