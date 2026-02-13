# 📋 Work Assignment Workflow - How Each Role Gets Tasks

## Overview

Work assignments in Justice Chain flow in a specific order:

```
POLICE files Case
       ↓
ADMIN approves & assigns work
       ↓
FORENSIC Officer gets assigned
       ↓
JUDGE gets assigned
       ↓
Case completed
```

---

## 🔄 Complete Assignment Flow

### **Stage 1: POLICE Creates Case**

```
POLICE Officer:
1. Logs into Police Dashboard
2. Clicks "Create Case"
3. Fills form:
   ├─ Case Title
   ├─ Description
   ├─ Case Number
   ├─ Location
   └─ Priority
4. Submits → Case created in MongoDB
5. Status: REGISTERED

Backend:
- POST /api/cases/create
- Saves to MongoDB
- Case visibility: Only this police officer sees it initially
```

**Example:**
```
Case: "Bank Robbery at Main Street"
Status: REGISTERED
Assigned To: None yet
Created By: Officer_John (POLICE)
```

---

### **Stage 2: POLICE Uploads Evidence**

```
POLICE Officer:
1. Selects case from dashboard
2. Clicks "Upload Evidence"
3. Uploads files:
   ├─ CCTV footage
   ├─ Photos
   ├─ Documents
   └─ Witness statements
4. Files stored in Pinata IPFS

Backend:
- POST /api/evidence/upload
- File stored: Pinata IPFS
- IPFS Hash saved to MongoDB
- Evidence visibility: Added to case
```

---

### **Stage 3: ADMIN Approves Case**

```
ADMIN (You):
1. Log in with admin wallet (or admin account)
2. Redirected to /dashboard/admin
3. DashboardSwitcher appears (top-right)
4. See "Pending Approval" tab
5. Click case "Bank Robbery at Main Street"
6. Review:
   ├─ Case details
   ├─ Evidence uploaded
   ├─ Police officer info
   └─ Priority level
7. Click "Approve Case" button

Backend:
- PUT /api/cases/{id}/approve
- Case status: REGISTERED → APPROVED
- Case now visible to assign work

Database Update:
{
  "caseId": "123",
  "status": "APPROVED",
  "approvedBy": "admin",
  "approvedAt": "2026-02-13T10:30:00Z"
}
```

---

### **Stage 4: ADMIN Assigns FORENSIC Officer**

```
ADMIN (You):
1. In Admin Dashboard
2. Locate approved case
3. Click "Assign Forensic Officer"
4. A form appears:
   ├─ Case ID (auto-filled)
   ├─ Forensic Officer dropdown
   │  ├─ Officer1
   │  ├─ Officer2
   │  └─ Officer3
   └─ Submit button
5. Select "Officer2" (Forensic)
6. Click "Assign"

Backend:
- PUT /api/cases/assign-forensic
- Update case:
  ├─ forensicOfficerId: "Officer2"
  ├─ status: "IN_FORENSIC_ANALYSIS"
  └─ assignedAt: timestamp

FORENSIC Officer (Officer2):
- Next time Officer2 logs in
- Police Dashboard shows:
  ├─ "Bank Robbery at Main Street" (new!)
  ├─ Status: IN_FORENSIC_ANALYSIS
  ├─ Evidence ready to analyze
  └─ "Analyze Evidence" button available

Notification (Optional):
- Email sent: "Case assigned to you"
- Contains: Case details, evidence links
```

---

### **Stage 5: ADMIN Assigns JUDGE**

```
ADMIN (You):
1. Still in Admin Dashboard
2. Same case "Bank Robbery at Main Street"
3. Click "Assign Judge"
4. A form appears:
   ├─ Case ID (auto-filled)
   ├─ Judge dropdown
   │  ├─ Judge1
   ├─ Judge2
   │  └─ Judge3
   └─ Submit button
5. Select "Judge1"
6. Click "Assign"

Backend:
- PUT /api/cases/assign-judge
- Update case:
  ├─ judgeId: "Judge1"
  ├─ status: "READY_FOR_HEARING"
  └─ assignedAt: timestamp

JUDGE (Judge1):
- Next time Judge1 logs in
- Judge Dashboard shows:
  ├─ "Bank Robbery at Main Street" (new!)
  ├─ Status: READY_FOR_HEARING
  ├─ Evidence chain available
  ├─ Forensic report ready
  └─ "Submit Verdict" button available

Notification (Optional):
- Email sent: "Case assigned for hearing"
- Contains: Case details, evidence details
```

---

## 📊 Assignment Status for Each Role

### **What POLICE Sees**

```
Police Dashboard - My Cases:

Case 1: "Bank Robbery"
├─ Status: REGISTERED
├─ Created: Today
├─ Assigned To: None
├─ Action: Upload evidence
└─ Evidence: 3 files uploaded

Case 2: "Theft"
├─ Status: APPROVED
├─ Created: Yesterday
├─ Assigned To: Officer2 (Forensic)
├─ Action: Waiting for analysis
└─ Evidence: 5 files uploaded

Case 3: "Fraud"
├─ Status: IN_FORENSIC_ANALYSIS
├─ Created: 2 days ago
├─ Assigned To: Officer2 (Forensic), Judge1 (Judge)
├─ Action: Waiting for verdict
└─ Evidence: Analyzed
```

**POLICE Can Do:**
- ✅ Create cases
- ✅ Upload evidence
- ✅ View case status
- ✅ See who it's assigned to
- ❌ Cannot assign work
- ❌ Cannot analyze evidence
- ❌ Cannot submit verdicts

---

### **What FORENSIC Officer Sees**

```
Forensic Dashboard - Assigned Cases:

Case 1: "Bank Robbery"
├─ Status: IN_FORENSIC_ANALYSIS
├─ Assigned By: Admin
├─ Assigned To: Me (Forensic Officer)
├─ Evidence:
│  ├─ CCTV footage.mp4
│  ├─ photos.zip
│  └─ witness_statements.pdf
├─ Action: Analyze evidence
└─ Judge: Judge1 (waiting)

Case 2: "Theft"
├─ Status: ANALYSIS_COMPLETE
├─ Assigned By: Admin
├─ My Analysis: "No fingerprints found"
├─ Submitted: Yesterday
└─ Judge: Judge1 (reviewing)
```

**FORENSIC Can Do:**
- ✅ View assigned cases
- ✅ View evidence
- ✅ Analyze evidence
- ✅ Submit analysis reports
- ✅ Mark evidence as analyzed
- ❌ Cannot create cases
- ❌ Cannot approve cases
- ❌ Cannot assign work to others
- ❌ Cannot submit verdicts

---

### **What JUDGE Sees**

```
Judge Dashboard - Assigned Cases:

Case 1: "Bank Robbery"
├─ Status: READY_FOR_HEARING
├─ Assigned By: Admin
├─ Assigned To: Me (Judge)
├─ Police Officer: Officer_John
├─ Forensic Officer: Officer2
├─ Forensic Report: "No fingerprints found"
├─ Evidence Chain: 8 pieces
├─ Action: Submit verdict
└─ Verdict Options: GUILTY, NOT GUILTY, ACQUITTED

Case 2: "Theft"
├─ Status: CLOSED
├─ My Verdict: GUILTY
├─ Submitted: Yesterday
├─ Immutable On: Blockchain ✓
└─ Case closed
```

**JUDGE Can Do:**
- ✅ View assigned cases
- ✅ Review all evidence
- ✅ Read forensic reports
- ✅ View case details
- ✅ Submit verdict
- ✅ Mark case as immutable on blockchain
- ❌ Cannot create cases
- ❌ Cannot analyze evidence
- ❌ Cannot assign work
- ❌ Cannot approve cases

---

## 🔑 Key Assignment Points

### **Who Can Assign Work?**

```
ADMIN Only:
├─ Approves POLICE cases
├─ Assigns FORENSIC Officers
└─ Assigns JUDGES

POLICE Cannot Assign:
├─ ❌ Cannot assign themselves
├─ ❌ Cannot assign forensic officers
└─ ❌ Cannot assign judges

FORENSIC Cannot Assign:
├─ ❌ Cannot assign judges
├─ ❌ Cannot assign other forensic officers
└─ ❌ Can only work on assigned cases

JUDGE Cannot Assign:
├─ ❌ Cannot assign anyone
└─ ❌ Can only submit verdicts
```

---

## 📝 Assignment Database Updates

### **Case Document in MongoDB**

```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "caseNumber": "2026-001",
  "title": "Bank Robbery at Main Street",
  "description": "...",
  "status": "READY_FOR_HEARING",
  
  // Assignments
  "policeOfficerId": "Police_Officer_1",
  "forensicOfficerId": "Forensic_Officer_2",
  "judgeId": "Judge_1",
  
  // Timestamps
  "createdAt": "2026-02-13T09:00:00Z",
  "approvedAt": "2026-02-13T10:00:00Z",
  "assignedToForensicAt": "2026-02-13T10:05:00Z",
  "assignedToJudgeAt": "2026-02-13T10:10:00Z",
  "verdictSubmittedAt": null,
  "closedAt": null
}
```

---

## 🚀 API Endpoints for Assignment

### **POLICE - Create Case**
```
POST /api/cases/create
Headers: Authorization: Bearer {token}
Body: {
  "title": "Case Title",
  "description": "Details",
  "caseNumber": "2026-001",
  "location": "Location",
  "priority": "HIGH"
}
```

### **ADMIN - Approve Case**
```
PUT /api/cases/{caseId}/approve
Headers: Authorization: Bearer {admin_token}
Response: Case status → APPROVED
```

### **ADMIN - Assign Forensic Officer**
```
PUT /api/cases/assign-forensic
Headers: Authorization: Bearer {admin_token}
Body: {
  "caseId": "123",
  "forensicId": "Officer_ID"
}
Response: Case status → IN_FORENSIC_ANALYSIS
```

### **ADMIN - Assign Judge**
```
PUT /api/cases/assign-judge
Headers: Authorization: Bearer {admin_token}
Body: {
  "caseId": "123",
  "judgeId": "Judge_ID"
}
Response: Case status → READY_FOR_HEARING
```

### **FORENSIC - Submit Analysis**
```
PUT /api/evidence/{evidenceId}/analysis
Headers: Authorization: Bearer {forensic_token}
Body: {
  "analysisReport": "Analysis details",
  "analysisNotes": "Additional notes"
}
```

### **JUDGE - Submit Verdict**
```
POST /api/cases/{caseId}/verdict
Headers: Authorization: Bearer {judge_token}
Body: {
  "decision": "GUILTY",
  "remarks": "Based on evidence..."
}
Response: Case status → CLOSED, marked on blockchain
```

---

## 🔐 Case Status Flow

```
┌──────────────┐
│  REGISTERED  │  (POLICE created case)
└──────┬───────┘
       │
       ↓
┌──────────────────┐
│    APPROVED      │  (ADMIN approved)
└──────┬───────────┘
       │
       ↓
┌─────────────────────────┐
│ IN_FORENSIC_ANALYSIS    │  (FORENSIC Officer assigned & analyzing)
└──────┬──────────────────┘
       │
       ↓
┌───────────────────────┐
│ ANALYSIS_COMPLETE     │  (FORENSIC submitted analysis)
└──────┬────────────────┘
       │
       ↓
┌───────────────────────┐
│ READY_FOR_HEARING     │  (JUDGE assigned)
└──────┬────────────────┘
       │
       ↓
┌───────────────────────┐
│     CLOSED            │  (JUDGE submitted verdict)
└──────┬────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ IMMUTABLE ON BLOCKCHAIN      │  (Case finalized)
└──────────────────────────────┘
```

---

## 📊 Example: Complete Case Journey

```
Day 1 - 9:00 AM
POLICE Officer John creates case: "Bank Robbery"
├─ Status: REGISTERED
└─ Evidence: 3 files uploaded

Day 1 - 10:00 AM
ADMIN approves case
├─ Status: APPROVED
└─ Ready for assignment

Day 1 - 10:05 AM
ADMIN assigns FORENSIC Officer2
├─ Status: IN_FORENSIC_ANALYSIS
└─ Forensic Officer2 sees case in dashboard

Day 1 - 10:30 AM
FORENSIC Officer2 views case
├─ Analyzes evidence
├─ Writes analysis report
└─ Submits: "Fingerprints found on door"

Day 1 - 10:35 AM
ADMIN assigns JUDGE Judge1
├─ Status: READY_FOR_HEARING
└─ Judge1 sees case in dashboard

Day 1 - 10:45 AM
JUDGE Judge1 views case
├─ Reviews evidence
├─ Reads forensic report
└─ Submits Verdict: GUILTY

Day 1 - 10:50 AM
Case CLOSED
├─ Status: CLOSED
├─ Marked on blockchain (immutable)
└─ All evidence locked

Case Complete! ✓
```

---

## ✅ Summary

| Role | Creates | Approves | Assigns | Analyzes | Verdicts |
|------|---------|----------|---------|----------|----------|
| POLICE | ✅ | ❌ | ❌ | ❌ | ❌ |
| ADMIN | ❌ | ✅ | ✅ | ❌ | ❌ |
| FORENSIC | ❌ | ❌ | ❌ | ✅ | ❌ |
| JUDGE | ❌ | ❌ | ❌ | ❌ | ✅ |

**Key Point:** Each role has a specific purpose and only sees work assigned to them!
