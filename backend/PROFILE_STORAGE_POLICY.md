# 🔐 Doctor Profile Data Storage - Strict Enforcement Policy

## Overview
Doctor profile data is **STRICTLY stored ONLY in the `doctor_profiles` table**.
No profile data is stored in any other table.

---

## ✅ Verification Results

### 1. **doctor_profiles Table** - ONLY place where profile data is stored
```
Columns with profile data:
✅ specialization      - Medical specialization (text)
✅ experience          - Years of experience (0-70)
✅ hospital_name       - Hospital/Clinic name (text)
✅ address             - Professional address (text, min 10 chars)
✅ is_verified         - Approval status (boolean)
✅ certificate_file_id - Reference to uploaded certificate (FK)
```

### 2. **users Table** - Authentication data ONLY
```
Columns stored:
✅ id          - User ID (primary key)
✅ name        - Full name
✅ email       - Email address
✅ password    - Hashed password
✅ role        - User role (patient/doctor/admin)
✅ created_at  - Registration timestamp

❌ NO profile data (specialization, experience, etc.)
```

### 3. **doctor_approvals Table** - Approval workflow data ONLY
```
Columns stored:
✅ id                  - Approval ID
✅ doctor_id          - Reference to doctor (FK)
✅ certificate_file_id - Reference to certificate file (FK)
✅ status             - pending/approved/rejected
✅ admin_message      - Rejection reason
✅ submitted_at       - Request timestamp
✅ reviewed_at        - Review timestamp

❌ NO profile data (specialization, experience, etc.)
  Uses JOINs to retrieve profile data from doctor_profiles when needed
```

### 4. **files Table** - File metadata ONLY
```
Columns stored:
✅ id           - File ID
✅ user_id      - Owner user ID (FK)
✅ file_name    - Original filename
✅ file_path    - Disk storage path
✅ file_type    - certificate/medical_report/profile_image
✅ hash_value   - File hash
✅ uploaded_at  - Upload timestamp

❌ NO profile data (specialization, experience, etc.)
```

---

## 📋 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   DOCTOR PROFILE SETUP                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
              1. Upload Certificate File
                              ↓
              ┌───────────────────────────────┐
              │   Stored in TWO places:       │
              │   1. files table (metadata)   │
              │   2. Disk storage (actual)    │
              └───────────────────────────────┘
                              ↓
      2. Create Doctor Profile (specialization, experience, etc.)
                              ↓
              ┌───────────────────────────────┐
              │   Stored in:                  │
              │   1. doctor_profiles table    │
              │   (and NOWHERE ELSE)          │
              └───────────────────────────────┘
                              ↓
              3. Request Approval
                              ↓
              ┌───────────────────────────────┐
              │   Stored in:                  │
              │   1. doctor_approvals table   │
              │      (approval status only)   │
              │   2. notifications table      │
              │      (admin notification)     │
              └───────────────────────────────┘
                              ↓
        4. Admin Reviews Doctor (JOINs 4 tables)
                              ↓
    JOINs: doctor_approvals + users + doctor_profiles + files
    
    - doctor_approvals: approval status
    - users: doctor name/email
    - doctor_profiles: specialization, experience, hospital, address ← SINGLE SOURCE
    - files: certificate file info
```

---

## 🔒 Strict Enforcement Rules

### Rule 1: Profile Data is READ-ONLY from doctor_profiles
When profile data is needed, always:
- **READ from**: `doctor_profiles` table
- **NEVER READ from**: Any other table

### Rule 2: Profile Data is WRITTEN-ONLY to doctor_profiles
When profile data is submitted:
- **WRITE to**: `doctor_profiles` table
- **NEVER WRITE to**: users, doctor_approvals, files, or any other table

### Rule 3: Other Tables Only Store References
- `doctor_approvals` stores: `doctor_id` (FK) + `certificate_file_id` (FK)
- `files` stores: `user_id` (FK) for uploaded file metadata
- `users` stores: Only authentication data

### Rule 4: Data Consistency Strategy
- Profile data is the SINGLE SOURCE OF TRUTH in `doctor_profiles`
- All queries that need profile data use JOINs to fetch from `doctor_profiles`
- Updates to profile data ONLY modify the `doctor_profiles` table

---

## 🛠️ Code Implementation Enforcements

### In DoctorProfile.js (Model)
```javascript
// updateProfile() uses dynamic queries
// Only updates fields that are provided
// Never accidentally NULLs existing data
// Profile data ONLY goes to doctor_profiles table
```

### In ProfileController.js (Controller)
```javascript
// createDoctorProfile() validates strictly:
// - No empty strings
// - No NULL values
// - Proper types and ranges
// - Inserts/updates ONLY to doctor_profiles table
```

### In DoctorApprovalModel.js (Model)
```javascript
// Approval queries use JOINs to fetch profile data
// Never stores profile data directly
// Profile data retrieved from doctor_profiles table
```

---

## 📊 Data Storage Summary Table

| Data Item | Storage Location | Other Locations |
|-----------|------------------|-----------------|
| specialization | ✅ doctor_profiles | ❌ Never elsewhere |
| experience | ✅ doctor_profiles | ❌ Never elsewhere |
| hospital_name | ✅ doctor_profiles | ❌ Never elsewhere |
| address | ✅ doctor_profiles | ❌ Never elsewhere |
| is_verified | ✅ doctor_profiles | ❌ Never elsewhere |
| doctor_id | doctor_approvals + users | Links to doctor_profiles |
| certificate_file_id | doctor_profiles + doctor_approvals | Stored once, referenced twice |
| file metadata | ✅ files | Certificate data, not profile |
| User auth data | ✅ users | Basic info, not profile |

---

## ✅ Verification Checklist

Run this command to verify profile data isolation:
```bash
cd backend
node verify-profile-storage.js
```

Expected output:
- ✅ doctor_profiles has all profile columns
- ✅ users table has NO profile columns
- ✅ doctor_approvals has NO profile columns
- ✅ files table has NO profile columns
- ✅ No duplicate profile data found

---

## 🚀 Future Guidelines

When modifying profile-related code, ensure:
1. ✅ Profile data is READ from `doctor_profiles` table
2. ✅ Profile data is WRITTEN to `doctor_profiles` table only
3. ✅ No profile data is added to users table
4. ✅ No profile data is added to doctor_approvals table
5. ✅ No profile data is added to files table
6. ✅ Other tables only store references (foreign keys)
7. ✅ JOINs are used to retrieve profile data when needed

---

## Last Verified
**Date**: April 19, 2026  
**Status**: ✅ PASSED  
**Verification Script**: verify-profile-storage.js
