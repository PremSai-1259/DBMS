# Visual UI Flow: 3-Step Doctor Registration

## Complete Visual Walkthrough

---

## STEP 1: Profile Creation Form

```
┌─────────────────────────────────────────────────────────────────┐
│                    DOCTOR REGISTRATION                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Progress:  Step 1 ━━━ Step 2 ━━━ Step 3                         │
│            (active)                                              │
│                                                                   │
│  STEP 1: Create Your Professional Profile                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│                                                                   │
│  Specialization *                                                │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ ▼ Cardiology                                                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Years of Experience *                                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 12                                                            │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Hospital/Clinic Name *                                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ City Medical Center                                           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Professional Address *                                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 123 Medical Ave,                                             │ │
│  │ New York, NY 10001                                           │ │
│  │                                                               │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ⚠️ NO FILE UPLOAD HERE - THAT'S IN STEP 2                      │
│                                                                   │
│                                                                   │
│              ┌──────────────────────────────┐                   │
│              │ Continue to Certificate      │                   │
│              │ Upload                       │                   │
│              └──────────────────────────────┘                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**User Fills:**
- ✅ Specialization (from dropdown)
- ✅ Experience (number 0-70)
- ✅ Hospital Name (text)
- ✅ Address (textarea, min 10 chars)

**User Clicks:** "Continue to Certificate Upload"

**Backend Action:**
- 📝 Profile created WITHOUT certificate
- 💾 Saved to `doctor_profiles` table
- 🔓 `certificate_file_id` stays NULL

---

## STEP 2: Certificate Upload Form

```
┌─────────────────────────────────────────────────────────────────┐
│                    DOCTOR REGISTRATION                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Progress:  Step 1 ✓ Step 2 ━━━ Step 3                          │
│                    (active)                                      │
│                                                                   │
│  STEP 2: Upload Your Medical Certificate                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│                                                                   │
│  Medical Certificate *                                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                                                               │ │
│  │            📎 DRAG & DROP FILE HERE                         │ │
│  │                                                               │ │
│  │           OR  [📁 CLICK TO SELECT FILE]                     │ │
│  │                                                               │ │
│  │  Allowed: PDF, JPEG, PNG (Max 10MB)                         │ │
│  │                                                               │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Selected File:                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ ✅ certificate.pdf (2.5 MB)                                 │ │
│  │    [Preview]                                                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│                                                                   │
│              ┌──────────────────────────────┐                   │
│              │ Upload & Request Approval    │                   │
│              └──────────────────────────────┘                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**User Actions:**
- ✅ Drag & drop file OR click to select
- ✅ Selects PDF/JPEG/PNG file (max 10MB)
- ✅ File preview shows

**Validation:**
- ❌ Wrong format (.doc, .txt) → Error: "Only PDF/JPEG/PNG allowed"
- ❌ File too large (> 10MB) → Error: "File must be less than 10MB"
- ✅ Valid file → Button enabled

**User Clicks:** "Upload & Request Approval"

**Backend Action:**
1. 📤 Upload file to `/uploads` folder
2. 💾 Save to `files` table (file_type='certificate')
3. 🔗 Link file to profile: `certificate_file_id = <file_id>`
4. 📋 Create approval request: `doctor_approvals` table
5. 📧 Send notification to admin: "New doctor approval pending"

---

## STEP 3: Success Confirmation

```
┌─────────────────────────────────────────────────────────────────┐
│                    DOCTOR REGISTRATION                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Progress:  Step 1 ✓ Step 2 ✓ Step 3                           │
│                            (complete)                            │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                                                               │ │
│  │                      ✅ SUCCESS! ✅                          │ │
│  │                                                               │ │
│  │  Your profile and certificate have been submitted!           │ │
│  │                                                               │ │
│  │  📋 Profile Information Saved:                               │ │
│  │     • Specialization: Cardiology                             │ │
│  │     • Experience: 12 years                                   │ │
│  │     • Hospital: City Medical Center                          │ │
│  │     • Address: 123 Medical Ave, NY 10001                     │ │
│  │                                                               │ │
│  │  📂 Certificate:                                             │ │
│  │     • File: certificate.pdf                                  │ │
│  │     • Size: 2.5 MB                                           │ │
│  │     • Status: ⏳ Pending Admin Review                        │ │
│  │                                                               │ │
│  │  ⏱️ Next Steps:                                             │ │
│  │     An admin will review your credentials within 24-48       │ │
│  │     hours and notify you via email.                          │ │
│  │                                                               │ │
│  │  📧 You'll receive one of:                                   │ │
│  │     • ✅ Approval notification                               │ │
│  │     • ❌ Rejection with feedback                             │ │
│  │                                                               │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│              ┌──────────────────────────────┐                   │
│              │ Go to Dashboard              │                   │
│              └──────────────────────────────┘                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Shows:**
- ✅ All entered information
- ✅ File name and size
- ✅ Status: "Pending Admin Review"
- ✅ Expected timeline
- ✅ What happens next

**User Clicks:** "Go to Dashboard"

**Frontend Action:**
- Redirect to Doctor Dashboard
- Show banner: "Your profile is pending verification"

---

## SCENARIO: Rejection & Resubmission

### After Rejection

```
Doctor receives email:

    From: admin@hospital.com
    Subject: ❌ Your Doctor Profile Was Rejected
    
    Dear Dr. [Name],
    
    Unfortunately, your doctor profile was not approved.
    
    Reason: Certificate quality is not clear enough.
            Please upload a higher resolution image.
    
    You can resubmit your profile here:
    [Link to resubmit]
    
    Best regards,
    Hospital Admin Team
```

### Doctor Logs In & Visits Profile Setup

```
┌─────────────────────────────────────────────────────────────────┐
│                    DOCTOR REGISTRATION                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ⚠️ PROFILE REJECTED - Please Resubmit                          │
│                                                                   │
│  Progress:  Step 1 ━━━ Step 2 ━━━ Step 3                         │
│            (restart)                                              │
│                                                                   │
│  STEP 1: Update Your Professional Profile                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│                                                                   │
│  Admin Feedback:                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ ⚠️ Certificate quality is not clear enough.                 │ │
│  │    Please upload a higher resolution image.                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Specialization *                                                │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ ▼ Cardiology                        [PRE-FILLED] ✅           │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Years of Experience *                                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 12                                 [PRE-FILLED] ✅           │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Hospital/Clinic Name *                                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ City Medical Center                [PRE-FILLED] ✅           │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Professional Address *                                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 123 Medical Ave, New York, NY 10001 [PRE-FILLED] ✅          │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│              ┌──────────────────────────────┐                   │
│              │ Continue to Certificate      │                   │
│              │ Upload                       │                   │
│              └──────────────────────────────┘                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Smart Detection:**
- ✅ System detects rejection
- ✅ Form auto-fills with previous data
- ✅ Shows admin feedback
- ✅ Doctor can edit if needed

**Doctor clicks:** "Continue to Certificate Upload"

### Resubmit Certificate

```
Step 2 appears again:

┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│  Progress:  Step 1 ✓ Step 2 ━━━ Step 3                          │
│                    (active)                                      │
│                                                                   │
│  STEP 2: Upload Your Medical Certificate                         │
│                                                                   │
│  Previous Issue: Certificate quality is not clear enough.       │
│  Please upload a higher resolution image.                       │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                                                               │ │
│  │            📎 DRAG & DROP FILE HERE                         │ │
│  │           (Upload higher resolution certificate)             │ │
│  │                                                               │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Selected File:                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ ✅ certificate_hq.pdf (4.2 MB)    [NEW FILE]               │ │
│  │    [Preview - Higher Resolution]                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│              ┌──────────────────────────────┐                   │
│              │ Upload & Request Approval    │                   │
│              └──────────────────────────────┘                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Doctor uploads:** New high-resolution certificate

### Resubmission Confirmation

```
Step 3 appears:

┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│                      ✅ SUCCESS! ✅                              │
│                                                                   │
│  Your profile has been resubmitted for review!                  │
│                                                                   │
│  Previous Issue:                                                 │
│  ✅ FIXED: Uploaded higher resolution certificate                │
│                                                                   │
│  An admin will review your updated profile within 24-48 hours.  │
│                                                                   │
│              ┌──────────────────────────────┐                   │
│              │ Go to Dashboard              │                   │
│              └──────────────────────────────┘                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Result:**
- ✅ New profile created with old data
- ✅ New certificate uploaded
- ✅ New approval request sent to admin
- ✅ Doctor back to "Pending" status

---

## Error Scenarios

### ❌ File Type Error
```
┌─────────────────────────────────────────┐
│ ❌ Invalid File Type                     │
│                                          │
│ Only PDF, JPEG, or PNG files allowed.   │
│ You selected: Word Document (.doc)      │
│                                          │
│ [Try Different File]                    │
└─────────────────────────────────────────┘
```

### ❌ File Too Large
```
┌─────────────────────────────────────────┐
│ ❌ File Too Large                        │
│                                          │
│ Maximum file size: 10 MB                │
│ Your file: 15.3 MB                      │
│                                          │
│ Please compress or resize your file.    │
│                                          │
│ [Try Different File]                    │
└─────────────────────────────────────────┘
```

### ❌ Already Pending Approval
```
┌─────────────────────────────────────────┐
│ ⏳ Profile Pending Review                │
│                                          │
│ Your profile is already pending admin   │
│ review. Please wait for our response.   │
│                                          │
│ Status: Pending (submitted Jan 15)      │
│ Expected: Jan 17-18                     │
│                                          │
│ [Go to Dashboard]                       │
└─────────────────────────────────────────┘
```

### ❌ Already Approved
```
┌─────────────────────────────────────────┐
│ ✅ Already Approved                      │
│                                          │
│ Your doctor profile is already approved!│
│ You can now see patients.               │
│                                          │
│ Approved: Jan 16, 2026                  │
│                                          │
│ [Go to Dashboard]                       │
└─────────────────────────────────────────┘
```

---

## Summary: What Changed

| Before (Old) | After (New) |
|---|---|
| 1 page form | 3 sequential steps |
| Profile + File together | Profile → File → Success |
| No progress indicator | Clear progress bar |
| No validation feedback | Step-by-step validation |
| Confusing for new users | Easy to understand |

✅ **Result**: Better UX, clearer workflow, better data management!
