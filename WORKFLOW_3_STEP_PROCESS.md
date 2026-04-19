# Doctor Workflow: 3-Step Process

## Overview

The doctor registration and approval workflow has been reorganized into **3 distinct steps**:

1. **Step 1: Profile Creation** - Enter medical credentials (no file upload)
2. **Step 2: Certificate Upload** - Upload certificate for verification
3. **Step 3: Complete** - Success confirmation

This separates profile creation from document verification for better UX.

---

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    DOCTOR REGISTRATION                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │  STEP 1: Create Profile (NEW)          │
        ├───────────────────────────────────────┤
        │  - Specialization                      │
        │  - Years of Experience                 │
        │  - Hospital/Clinic Name                │
        │  - Professional Address                │
        │  (NO FILE UPLOAD HERE)                 │
        └───────────────────────────────────────┘
                            │
                            ▼ Submit
        ┌───────────────────────────────────────┐
        │  STEP 2: Upload Certificate (NEW)      │
        ├───────────────────────────────────────┤
        │  - Upload medical certificate          │
        │  - PDF/JPEG/PNG (max 10MB)             │
        │  - Request approval                    │
        └───────────────────────────────────────┘
                            │
                            ▼ Upload & Submit
        ┌───────────────────────────────────────┐
        │  STEP 3: Complete (NEW)                │
        ├───────────────────────────────────────┤
        │  ✅ Profile created                    │
        │  ✅ Certificate uploaded               │
        │  ✅ Approval request submitted         │
        │  (Pending admin verification)         │
        └───────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │  Admin Verification                    │
        ├───────────────────────────────────────┤
        │  □ Review profile                      │
        │  □ Download & verify certificate       │
        │  □ Approve or Reject                   │
        └───────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
        ✅ APPROVED              ❌ REJECTED
        is_verified=1            Delete profile
        status=approved          Send email with reason
        Can see patients         Doctor can resubmit
```

---

## Frontend Changes

### File: `frontend/src/pages/DoctorProfileSetup.jsx`

**Before**: Single form with all fields + file upload

**After**: 3-step wizard with separate forms

#### Key Changes:

1. **Progress Indicator**
   ```
   Step 1 ━━━ Step 2 ━━━ Step 3
   ```

2. **Step 1: Profile Form**
   - Specialization (dropdown)
   - Years of Experience (number: 0-70)
   - Hospital/Clinic Name (text)
   - Professional Address (textarea, min 10 chars)
   - Button: "Continue to Certificate Upload"
   - **NO** file upload field

3. **Step 2: Certificate Modal**
   - File upload with drag-drop UI
   - Validation: PDF/JPEG/PNG, max 10MB
   - Button: "Upload & Request Approval"
   - Uploads certificate
   - Requests approval with certificate file ID

4. **Step 3: Completion**
   - Success message
   - "Go to Dashboard" button

---

## Backend Changes

### File: `backend/controllers/profilecontroller.js`

**createDoctorProfile()** endpoint:

**Before**: 
```javascript
// Accepted certificateFileId in request body
// Stored it immediately
```

**After**:
```javascript
// certificateFileId is OPTIONAL
// Profile is created WITHOUT certificate
// Certificate is linked later during Step 2
// Message: "Doctor profile created successfully. Now upload your certificate."
```

---

## Database Schema (No Changes)

```sql
doctor_profiles:
- id
- user_id
- specialization (NOT NULL) ✅
- experience (NOT NULL) ✅
- hospital_name (NOT NULL) ✅
- address (NOT NULL) ✅
- certificate_file_id (NULL initially, set in Step 2) ✅
- is_verified (0 until admin approves)
```

Certificate is stored separately:
```sql
files:
- id
- user_id
- file_name
- file_path
- file_type = 'certificate'
```

Then linked via `doctor_profiles.certificate_file_id`

---

## API Endpoints Used

### Step 1: Create Profile
```
POST /api/profile
Body: {
  specialization: "Cardiology",
  experience: 10,
  hospitalName: "ABC Hospital",
  address: "123 Medical Street, NYC 10001"
}
Response: 201
{
  message: "Doctor profile created successfully. Now upload your certificate.",
  profileId: 19,
  profile: { ... }
}
```

### Step 2: Upload Certificate & Request Approval
```
POST /api/files/upload
Body: FormData with file + fileType

POST /api/doctor-approvals/request
Body: {
  certificateFileId: 26
}
Response: 201
{
  message: "Doctor approval request submitted successfully",
  approvalId: 20,
  status: "pending"
}
```

---

## User Experience Flow

### New Doctor (First Time)

1. Signs up ✅
2. **Step 1**: Fills profile form
   - Sees progress: 1 ━━━ 2 ━━━ 3
   - Clicks "Continue to Certificate Upload"
   - Profile saved ✅
3. **Step 2**: Uploads certificate
   - Sees progress: 1 ✓ 2 ━━━ 3
   - Selects file
   - Clicks "Upload & Request Approval"
   - Certificate uploaded ✅
   - Approval requested ✅
4. **Step 3**: Success
   - Sees progress: 1 ✓ 2 ✓ 3
   - Clicks "Go to Dashboard"
   - Message: "Pending admin review"

---

### Rejected Doctor (Resubmission)

1. Receives email: "Your profile was rejected"
2. Email includes: Reason (e.g., "Certificate not clear")
3. Logs in → Goes to profile setup
4. Sees pre-filled form with rejection reason
5. Updates profile fields as needed
6. **Step 1**: Fixes and continues
7. **Step 2**: Uploads corrected certificate
8. **Step 3**: Success - profile and certificate resubmitted

---

### Doctor with Pending Approval (Checks Later)

1. Goes to profile setup page
2. System detects: Status = 'pending'
3. Automatically skips to **Step 2**
4. Shows message: "Your profile is pending verification. Now upload your certificate."
5. If certificate already uploaded → Shows completion

---

## Validation Rules

### Step 1: Profile Validation
- ✅ Specialization: 3+ characters, required
- ✅ Experience: 0-70 years, required, valid number
- ✅ Hospital Name: 2+ characters, required
- ✅ Address: 10+ characters, required

### Step 2: Certificate Validation
- ✅ File type: PDF, JPEG, PNG only
- ✅ File size: Max 10MB
- ✅ File required: Cannot skip

---

## State Management

### Frontend State
```javascript
currentStep: 1 | 2 | 3                    // Current workflow step
form: { specialization, experience, ... } // Profile data
certificate: File | null                  // Selected file
loading: boolean                          // API call in progress
isResubmission: boolean                   // Pre-fill after rejection
rejectionReason: string                   // Previous admin message
```

### Error Handling
```javascript
409 Conflict:
  - "⏳ Your profile is already pending admin review..."
  - "✅ Your profile is already approved!"

400 Bad Request:
  - Invalid profile data (field-specific error)
  - Invalid certificate file

500 Server Error:
  - "Server error. Please try again later."
```

---

## Timeline

1. **Profile Creation**: Instant (< 1 second)
2. **Certificate Upload**: Depends on file size (1-10 seconds typical)
3. **Approval Submission**: Instant (< 1 second)
4. **Admin Review**: 24-48 hours
5. **Notification**: Email sent to doctor

---

## Benefits of 3-Step Workflow

✅ **Clearer UX**: Doctor knows exactly what to do  
✅ **Progress Tracking**: Visual progress indicators  
✅ **Error Recovery**: Can fix profile independently from file issues  
✅ **Better Mobile**: Smaller forms, easier to fill on mobile  
✅ **Separation of Concerns**: Profile ≠ Certificate  
✅ **Reusability**: Can update profile without re-uploading certificate  
✅ **Accessibility**: Step-by-step approach easier to understand  

---

## Testing Checklist

- [ ] Step 1: Profile form validates all fields
- [ ] Step 1: Submitting profile moves to Step 2
- [ ] Step 2: Can select certificate file
- [ ] Step 2: File validation works (reject wrong type/size)
- [ ] Step 2: Uploading shows progress
- [ ] Step 2: After upload, shows Step 3 success
- [ ] Rejection: Profile pre-fills with old data
- [ ] Rejection: Rejection reason displays
- [ ] Pending: Auto-skips to Step 2 if profile exists
- [ ] Error Messages: 409/400/500 errors show correct message
