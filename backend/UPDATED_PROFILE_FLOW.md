# 📋 **UPDATED: Doctor Profile Submission & Approval Flow**

## Overview
When a doctor submits their profile for approval:
1. **All profile data** (specialization, experience, hospital_name, address) → `doctor_profiles` table with `is_verified = 0`
2. **Certificate file** → `files` table (+ disk storage)
3. **Approval request** → `doctor_approvals` table with `status = pending`

When admin **rejects** the doctor:
- **Profile data is DELETED** from `doctor_profiles` table (doctor must resubmit)
- Approval record is kept in `doctor_approvals` table for history
- Doctor can create a new profile and resubmit

When admin **approves** the doctor:
- `is_verified` changes from `0` → `1`
- Profile data remains and is fully accessible

---

## 🔄 **Complete Updated Flow**

### **STAGE 1: DOCTOR CREATES PROFILE**

```
┌──────────────────────────────────┐
│  Doctor submits profile form:     │
│  - specialization                │
│  - experience                    │
│  - hospitalName                  │
│  - address                       │
│  - certificate file              │
└──────────────────────────────────┘
              ↓
    [Frontend Validation]
    ✓ Trim & validate all fields
    ✓ Certificate type & size check
              ↓
    POST /api/files/upload
    + certificate file
              ↓
    ┌────────────────────────────────────┐
    │  FILES TABLE                       │
    │  INSERT: file metadata             │
    │  ✅ id, user_id, file_name,        │
    │     file_path, file_type, etc.     │
    └────────────────────────────────────┘
              ↓
    POST /api/profile
    (with certificateFileId from step above)
              ↓
    ┌────────────────────────────────────┐
    │  BACKEND VALIDATION (Strict)       │
    │  - Trim all strings                │
    │  - Type checking                   │
    │  - Range validation                │
    │  - NO empty values allowed         │
    │  - NO NULL values allowed          │
    └────────────────────────────────────┘
              ↓
    ┌────────────────────────────────────┐
    │  DOCTOR_PROFILES TABLE             │
    │  INSERT: profile data              │
    │  ✅ user_id (FK)                   │
    │  ✅ specialization                 │
    │  ✅ experience                     │
    │  ✅ hospital_name                  │
    │  ✅ address                        │
    │  ✅ certificate_file_id (FK)       │
    │  ✅ is_verified: 0 (pending)       │
    │                                    │
    │  ⚠️  CRITICAL:                     │
    │  Profile data ONLY here!           │
    │  Never stored elsewhere!           │
    └────────────────────────────────────┘
              ↓
    POST /api/doctor-approvals/request
              ↓
    ┌────────────────────────────────────┐
    │  DOCTOR_APPROVALS TABLE            │
    │  INSERT: approval record           │
    │  ✅ doctor_id (FK)                 │
    │  ✅ certificate_file_id (FK)       │
    │  ✅ status: 'pending'              │
    │  ✅ submitted_at: NOW()            │
    │                                    │
    │  ⚠️  NO profile data stored here!  │
    │  Uses JOINs to get profile info    │
    └────────────────────────────────────┘
```

---

### **STAGE 2: ADMIN REVIEWS & REJECTS**

```
Admin Dashboard → Doctor Approval Requests
              ↓
    GET /api/doctor-approvals/pending
              ↓
    ┌────────────────────────────────┐
    │  JOIN QUERY:                   │
    │  doctor_approvals da           │
    │  + users u                     │
    │  + doctor_profiles dp          │
    │  + files f                     │
    │  WHERE status = 'pending'      │
    └────────────────────────────────┘
              ↓
    Admin sees pending doctor with
    ALL profile data + certificate
              ↓
    Admin clicks "REJECT"
    Provides rejection reason
              ↓
    ┌────────────────────────────────────┐
    │  STEP 1: Update approval status    │
    │  doctor_approvals:                 │
    │  SET status = 'rejected'           │
    │      reviewed_at = NOW()           │
    │      admin_message = reason        │
    └────────────────────────────────────┘
              ↓
    ┌────────────────────────────────────┐
    │  STEP 2: DELETE profile data       │
    │  doctor_profiles:                  │
    │  DELETE WHERE user_id = doctorId   │
    │  ✅ Profile deleted completely    │
    │  ✅ Doctor must resubmit           │
    └────────────────────────────────────┘
              ↓
    ┌────────────────────────────────────┐
    │  STEP 3: Send email notification   │
    │  Doctor informed of rejection      │
    │  + Reason provided                 │
    │  + Can resubmit with corrections   │
    └────────────────────────────────────┘
              ↓
    ✅ Rejection Complete
    - doctor_approvals: status = 'rejected' (kept for history)
    - doctor_profiles: DELETED (must resubmit)
    - Approval record preserved for audit trail
```

---

### **STAGE 3: DOCTOR RESUBMITS AFTER REJECTION**

```
Doctor receives rejection email
              ↓
Doctor logs in & goes to Profile Setup
              ↓
Check approval status API
    GET /api/doctor-approvals/status
              ↓
Returns: status = 'rejected', adminMessage, reason
              ↓
Doctor fills form AGAIN with corrections
              ↓
Doctor clicks "Submit for Approval"
              ↓
    POST /api/profile (new profile data)
              ↓
    ┌────────────────────────────────────┐
    │  DOCTOR_PROFILES TABLE             │
    │  INSERT: NEW profile record        │
    │  (old one was deleted)             │
    │  ✅ is_verified: 0 (fresh start)   │
    └────────────────────────────────────┘
              ↓
    POST /api/doctor-approvals/request
              ↓
    ┌────────────────────────────────────┐
    │  DOCTOR_APPROVALS TABLE            │
    │  INSERT: NEW approval record       │
    │  ✅ doctor_id                      │
    │  ✅ certificate_file_id            │
    │  ✅ status: 'pending' (fresh)      │
    │                                    │
    │  ✅ Multiple records per doctor    │
    │  allowed (non-unique index on      │
    │  doctor_id)                        │
    └────────────────────────────────────┘
              ↓
    ✅ Resubmission Complete
    - New profile created in doctor_profiles
    - New approval request in doctor_approvals
    - Admin can review again
```

---

### **STAGE 4: ADMIN APPROVES**

```
Admin Dashboard → Sees resubmitted doctor
              ↓
Admin views details & reviews
              ↓
Admin clicks "APPROVE"
              ↓
    ┌────────────────────────────────────┐
    │  STEP 1: Validate profile          │
    │  Check ALL required fields exist   │
    │  - specialization ≠ NULL           │
    │  - experience ≠ NULL               │
    │  - hospital_name ≠ NULL            │
    │  - address ≠ NULL                  │
    │  ✅ Profile is complete            │
    └────────────────────────────────────┘
              ↓
    ┌────────────────────────────────────┐
    │  STEP 2: Update profile status     │
    │  doctor_profiles:                  │
    │  UPDATE is_verified = 1            │
    │  WHERE user_id = doctorId          │
    │  ✅ Profile marked verified        │
    └────────────────────────────────────┘
              ↓
    ┌────────────────────────────────────┐
    │  STEP 3: Update approval status    │
    │  doctor_approvals:                 │
    │  UPDATE status = 'approved'        │
    │         reviewed_at = NOW()        │
    └────────────────────────────────────┘
              ↓
    ┌────────────────────────────────────┐
    │  STEP 4: Send email & notification │
    │  Doctor informed of approval       │
    │  ✅ Doctor is now active           │
    │  ✅ Can generate appointment slots │
    └────────────────────────────────────┘
              ↓
    ✅ Approval Complete
    - doctor_profiles.is_verified = 1
    - doctor_approvals.status = 'approved'
    - Profile data PERSISTED ✅
    - Doctor is fully accessible in system
```

---

## 📊 **Data State Transitions**

### **Profile Lifecycle**

| Phase | doctor_profiles | doctor_approvals | Action | Status |
|-------|-----------------|------------------|--------|--------|
| 1. Create | INSERT (is_verified=0) | - | Doctor submits | Pending ⏳ |
| 2. Request Approval | ✅ Exists | INSERT (pending) | Doctor requests | Pending ⏳ |
| 3. Admin Views | ✅ Complete | Visible | Admin reviews | Pending ⏳ |
| 4a. Admin Rejects | **DELETE** | UPDATE (rejected) | Profile deleted | Rejected ❌ |
| 4b. Admin Approves | UPDATE (is_verified=1) | UPDATE (approved) | Profile approved | Approved ✅ |
| 5. Resubmit | INSERT (is_verified=0) | INSERT (pending) | New attempt | Pending ⏳ |

### **Key Decision Points**

```
Doctor fills form
        ↓
    ┌─────────────────────┐
    │ Profile Complete?   │
    └─────────────────────┘
      Yes ↓
    Store in doctor_profiles (is_verified=0)
      ↓
    Request approval
      ↓
    Admin Reviews
      ↓
    ┌─────────────────────┐
    │ Approve or Reject?  │
    └─────────────────────┘
      │                   │
      ↓                   ↓
    Approve          Reject
      │                   │
      ↓                   ↓
    UPDATE            DELETE
    is_verified=1     Profile
      │                   │
      ↓                   ↓
    Approved         Resubmit?
    ✅ Active         Yes ↓
    Can work          Create NEW profile
                      Try again
```

---

## 🔒 **Data Integrity Guarantees**

### **Profile Data Storage**
```
✅ STORED ONLY in doctor_profiles table
✅ Created with is_verified = 0
✅ Strict validation before INSERT
✅ Smart updates (never NULL existing fields)
❌ NEVER stored in users table
❌ NEVER stored in doctor_approvals table
❌ NEVER stored in files table
```

### **Rejection Handling**
```
✅ Profile data DELETED from doctor_profiles
✅ Doctor approval record kept (status='rejected')
✅ Admin message preserved for history
✅ Doctor can resubmit with new profile
✅ Approval history maintained
```

### **Approval Handling**
```
✅ is_verified changes from 0 → 1
✅ All profile data PERSISTS in doctor_profiles
✅ Doctor fully accessible in system
✅ No data loss on approval
✅ Patient can book appointments
```

---

## 🛠️ **Backend Implementation**

### **Model: DoctorProfile.js**
```javascript
// Create profile with is_verified = 0
static async create(userId, specialization, experience, hospitalName, address)

// Update profile (smart - only updates provided fields)
static async updateProfile(userId, updateData)

// Mark profile as verified (is_verified = 1)
static async setVerified(userId, verified = true)

// DELETE profile (called on rejection)
static async deleteByUserId(userId)
```

### **Controller: doctorApprovalController.js**
```javascript
// Request approval
requestApproval(req, res)
  → Checks profile exists & is complete
  → Creates approval record
  
// Approve doctor
approveDoctorRequest(req, res)
  → Validates profile completeness
  → Updates is_verified = 1
  → Updates approval status = 'approved'

// REJECT doctor - NEW BEHAVIOR
rejectDoctorRequest(req, res)
  → Updates approval status = 'rejected'
  → ⭐ DELETES profile from doctor_profiles
  → Sends email notification
  → Allows doctor to resubmit
```

---

## ✅ **Testing & Verification**

### **Run Complete Lifecycle Test**
```bash
node test-rejection-flow.js
```

**Expected Output:**
- ✅ Profile created with is_verified = 0
- ✅ Approval request created
- ✅ Admin REJECTS → Profile DELETED
- ✅ Approval record kept for history
- ✅ Doctor RESUBMITS with new profile
- ✅ New approval request created
- ✅ Admin APPROVES → is_verified = 1
- ✅ Profile data PERSISTED

### **Verify Profile Storage Isolation**
```bash
node verify-profile-storage.js
```

**Expected Output:**
- ✅ No profile data in users table
- ✅ No profile data in doctor_approvals table
- ✅ All profile data in doctor_profiles table only

---

## 📝 **Database Schema Changes**

### **doctor_approvals Table - UPDATED**
```sql
-- OLD: UNIQUE index on doctor_id prevented resubmission
-- NEW: NON-UNIQUE index allows multiple records per doctor

INDEX idx_doctor_id (doctor_id) -- NON-UNIQUE
```

**Benefit:** Doctor can create multiple approval records (one per submission attempt)

---

## 🚀 **Summary**

| Aspect | Before | After |
|--------|--------|-------|
| **Profile on rejection** | Kept with is_verified=0 | **DELETED** ✅ |
| **Doctor resubmission** | Couldn't create new profile | **Can resubmit** ✅ |
| **Approval record** | Deleted | **Kept for history** ✅ |
| **Multiple submissions** | Not possible (unique index) | **Possible** ✅ |
| **Profile data location** | doctor_profiles only | **doctor_profiles only** ✅ |
| **is_verified lifecycle** | 0 → 1 → 0 → 1 | **0 → 1 (after resubmit)** ✅ |

---

**✅ All requirements implemented and tested!**
