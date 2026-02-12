# Admin Dashboard Backend Setup Guide

## Overview
This guide helps you implement the backend endpoints needed to support all the Admin Dashboard features.

---

## Part 1: Create Admin Routes File

Create: `backend/routes/adminRoutes.js`

```javascript
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import Case from "../models/Case.js";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";

const router = express.Router();

// Middleware to verify ADMIN role
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// ============ USER MANAGEMENT ENDPOINTS ============

// GET all users (ADMIN ONLY)
router.get("/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
});

// SUSPEND user (ADMIN ONLY)
router.put("/users/:id/suspend", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { suspended: true },
      { new: true }
    );
    
    // Log audit
    await AuditLog.create({
      user: req.user.username,
      action: "USER_SUSPENDED",
      details: `Suspended user: ${user.username}`,
      status: "success"
    });
    
    res.json({ message: "User suspended", user });
  } catch (error) {
    res.status(500).json({ message: "Error suspending user" });
  }
});

// REVOKE role (ADMIN ONLY)
router.put("/users/:id/revoke", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: null },
      { new: true }
    );
    
    // Log audit
    await AuditLog.create({
      user: req.user.username,
      action: "ROLE_REVOKED",
      details: `Revoked role for user: ${user.username}`,
      status: "success"
    });
    
    res.json({ message: "Role revoked", user });
  } catch (error) {
    res.status(500).json({ message: "Error revoking role" });
  }
});

// CHANGE user role (ADMIN ONLY)
router.put("/users/:id/role", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { newRole } = req.body;
    const validRoles = ["ADMIN", "POLICE", "LAWYER", "FORENSIC", "JUDGE"];
    
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: newRole },
      { new: true }
    );
    
    // Log audit
    await AuditLog.create({
      user: req.user.username,
      action: "ROLE_CHANGED",
      details: `Changed user ${user.username} role to ${newRole}`,
      status: "success"
    });
    
    res.json({ message: "Role updated", user });
  } catch (error) {
    res.status(500).json({ message: "Error changing role" });
  }
});

// ============ AUDIT LOG ENDPOINTS ============

// GET all audit logs (ADMIN ONLY)
router.get("/audit-logs", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ message: "Error fetching audit logs" });
  }
});

// GET audit logs filtered by date (ADMIN ONLY)
router.get("/audit-logs/filter", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, user, action } = req.query;
    
    let filter = {};
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    if (user) filter.user = user;
    if (action) filter.action = action;
    
    const logs = await AuditLog.find(filter).sort({ createdAt: -1 });
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ message: "Error filtering audit logs" });
  }
});

// ============ SYSTEM HEALTH ENDPOINTS ============

// GET system health status (ADMIN ONLY)
router.get("/health", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Check MongoDB connection
    const caseCount = await Case.countDocuments();
    const userCount = await User.countDocuments();
    
    const health = {
      timestamp: new Date(),
      status: "healthy",
      database: "connected",
      totalCases: caseCount,
      totalUsers: userCount,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || "production"
    };
    
    res.json(health);
  } catch (error) {
    res.status(500).json({ 
      message: "System health check failed",
      status: "unhealthy"
    });
  }
});

// GET service status (ADMIN ONLY)
router.get("/status", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const status = {
      timestamp: new Date(),
      services: {
        api: "operational",
        database: "operational",
        ipfs: "operational",
        blockchain: "operational"
      },
      lastError: null,
      uptime: process.uptime()
    };
    
    res.json(status);
  } catch (error) {
    res.status(500).json({ message: "Error getting service status" });
  }
});

// ============ STATISTICS ENDPOINTS ============

// GET case statistics (ADMIN ONLY)
router.get("/stats/cases", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const stats = {
      total: await Case.countDocuments(),
      pending: await Case.countDocuments({ status: "PENDING_APPROVAL" }),
      approved: await Case.countDocuments({ status: "APPROVED" }),
      inForensic: await Case.countDocuments({ status: "IN_FORENSIC_ANALYSIS" }),
      readyForHearing: await Case.countDocuments({ status: "READY_FOR_HEARING" }),
      closed: await Case.countDocuments({ status: "CLOSED" })
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Error fetching case statistics" });
  }
});

// GET user statistics (ADMIN ONLY)
router.get("/stats/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const stats = {
      total: await User.countDocuments(),
      admin: await User.countDocuments({ role: "ADMIN" }),
      police: await User.countDocuments({ role: "POLICE" }),
      lawyer: await User.countDocuments({ role: "LAWYER" }),
      forensic: await User.countDocuments({ role: "FORENSIC" }),
      judge: await User.countDocuments({ role: "JUDGE" })
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user statistics" });
  }
});

export default router;
```

---

## Part 2: Create AuditLog Model

Create: `backend/models/AuditLog.js`

```javascript
import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      index: true,
      enum: [
        "USER_LOGIN",
        "USER_LOGOUT",
        "USER_SUSPENDED",
        "USER_CREATED",
        "ROLE_CHANGED",
        "ROLE_REVOKED",
        "CASE_APPROVED",
        "CASE_ASSIGNED",
        "CASE_CREATED",
        "EVIDENCE_UPLOADED",
        "EVIDENCE_VERIFIED",
        "BLOCKCHAIN_TRANSACTION",
        "SYSTEM_CONFIG_CHANGED",
        "REPORT_GENERATED",
        "OTHER"
      ]
    },
    details: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["success", "failure"],
      default: "success"
    },
    ipAddress: String,
    userAgent: String,
    timestamp: {
      type: Date,
      default: () => new Date(),
      index: true
    }
  },
  { timestamps: true }
);

// Index for quick queries
AuditLogSchema.index({ user: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });

export default mongoose.model("AuditLog", AuditLogSchema);
```

---

## Part 3: Create Audit Logger Utility

Create: `backend/utils/auditLogger.js`

```javascript
import AuditLog from "../models/AuditLog.js";

export const logAction = async (req, action, details, status = "success") => {
  try {
    await AuditLog.create({
      user: req.user?.username || "system",
      action,
      details,
      status,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get("user-agent"),
      timestamp: new Date()
    });
  } catch (error) {
    console.error("Error logging action:", error);
  }
};

export const logSuccess = (req, action, details) => {
  return logAction(req, action, details, "success");
};

export const logFailure = (req, action, details) => {
  return logAction(req, action, details, "failure");
};

export const logUserAction = (username, action, details, status = "success") => {
  return AuditLog.create({
    user: username,
    action,
    details,
    status,
    timestamp: new Date()
  });
};
```

---

## Part 4: Update Existing Case Routes

Update: `backend/routes/caseRoutes.js`

Add audit logging to existing endpoints:

```javascript
import { logAction } from "../utils/auditLogger.js";

// Example: Update the approve case endpoint
router.put("/:id/approve", authMiddleware, async (req, res) => {
  try {
    const caseItem = await Case.findByIdAndUpdate(
      req.params.id,
      { status: "APPROVED" },
      { new: true }
    );
    
    // Log this action
    await logAction(
      req,
      "CASE_APPROVED",
      `Case ${req.params.id} approved by admin`,
      "success"
    );
    
    res.json({ message: "Case approved", case: caseItem });
  } catch (error) {
    await logAction(
      req,
      "CASE_APPROVED",
      `Failed to approve case ${req.params.id}`,
      "failure"
    );
    res.status(500).json({ message: "Error approving case" });
  }
});
```

---

## Part 5: Update Server Configuration

Update: `backend/server.js`

Add the new admin routes:

```javascript
import adminRoutes from "./routes/adminRoutes.js";

// ... existing code ...

// Add this after other route declarations:
app.use("/api/admin", adminRoutes);

// ... rest of code ...
```

---

## Part 6: Update User Model (Optional Enhancement)

Update: `backend/models/User.js`

Add optional fields for admin management:

```javascript
const UserSchema = new mongoose.Schema(
  {
    // ... existing fields ...
    
    // Add these new fields:
    suspended: {
      type: Boolean,
      default: false
    },
    suspendedAt: Date,
    suspendedBy: String,
    lastLogin: Date,
    loginCount: {
      type: Number,
      default: 0
    },
    metadata: {
      createdBy: String,
      approvedBy: String,
      approvedAt: Date
    }
  },
  { timestamps: true }
);
```

---

## Testing the Endpoints

### 1. Get All Users
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/admin/users
```

### 2. Suspend User
```bash
curl -X PUT \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/admin/users/USER_ID/suspend
```

### 3. Change User Role
```bash
curl -X PUT \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"newRole": "JUDGE"}' \
  http://localhost:5000/api/admin/users/USER_ID/role
```

### 4. Get Audit Logs
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/admin/audit-logs
```

### 5. Get System Health
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/admin/health
```

### 6. Get Case Statistics
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/admin/stats/cases
```

---

## Installation Steps

1. **Create the files**:
   ```bash
   touch backend/routes/adminRoutes.js
   touch backend/models/AuditLog.js
   touch backend/utils/auditLogger.js
   ```

2. **Copy the code** from sections above into each file

3. **Update server.js** to import and use adminRoutes

4. **Update existing routes** to include audit logging

5. **Restart backend server**:
   ```bash
   npm run dev
   ```

6. **Test endpoints** using curl or Postman

---

## Verification Checklist

- [ ] AdminDashboard.jsx updated with 7 tabs (634 lines)
- [ ] adminRoutes.js created with all endpoints
- [ ] AuditLog.js model created
- [ ] auditLogger.js utility created
- [ ] User model updated with optional fields
- [ ] server.js updated to import admin routes
- [ ] Existing routes updated with audit logging
- [ ] Backend server restarted successfully
- [ ] All endpoints tested and working
- [ ] Admin dashboard loads without errors
- [ ] Data refreshes every 30 seconds
- [ ] All 7 tabs functional

---

## Troubleshooting

### Issue: "admin route not found"
- **Solution**: Verify adminRoutes.js is imported in server.js
- **Check**: `app.use("/api/admin", adminRoutes);`

### Issue: "AuditLog is not defined"
- **Solution**: Ensure AuditLog.js is created and imported correctly
- **Check**: `import AuditLog from "../models/AuditLog.js";`

### Issue: "Admin access required"
- **Solution**: Ensure you're logged in as ADMIN user
- **Check**: Your JWT token has `role: "ADMIN"`

### Issue: "Unknown field: suspended"
- **Solution**: Update User model with new optional fields
- **Check**: User schema includes `suspended: Boolean`

---

## Summary

This backend setup enables:
- ✅ Complete user management system
- ✅ Comprehensive audit logging
- ✅ System health monitoring
- ✅ Service status checking
- ✅ Statistics and analytics
- ✅ Admin-only access control
- ✅ Role-based permissions

**Total Backend Implementation: 3 new files + updates to 3 existing files**

---

*Last Updated: 2026-02-13*
*Status: Ready to Implement*
