# 🎯 Next Steps: Testing the 3-Step Workflow

## ✅ What's Been Done

Your doctor registration workflow has been completely restructured:

```
Old: 1 Page (Profile + Certificate Upload) 
     ↓
New: 3 Steps (Profile → Certificate → Success)
```

### Changes Made:
- ✅ Frontend: New 3-step DoctorProfileSetup.jsx component created
- ✅ Backend: Updated profilecontroller.js to allow optional certificate
- ✅ Database: Schema already supports NULL certificate_file_id
- ✅ Documentation: Complete workflow documentation created

---

## 🚀 How to Test

### 1️⃣ Start the Backend Server

```bash
cd c:\Users\shiva\ kumar\OneDrive\Desktop\DBMS_Project\DBMS\backend
npm start
```

**Expected Output:**
```
Server running on port 5000
Database connected
```

---

### 2️⃣ Start the Frontend Dev Server

```bash
cd c:\Users\shiva kumar\OneDrive\Desktop\DBMS_Project\DBMS\frontend
npm run dev
```

**Expected Output:**
```
  ➜  Local:   http://localhost:3001
```

---

### 3️⃣ Test: New Doctor Signup & Profile

**Steps:**
1. Go to http://localhost:3001
2. Click "Sign Up"
3. Create new doctor account
   ```
   Email: testdoctor@test.com
   Password: Test@123
   Role: Doctor
   ```
4. After signup, should redirect to profile setup

---

### 4️⃣ Test: Step 1 - Profile Creation

**You should see:**
```
Step 1 ━━━ Step 2 ━━━ Step 3

STEP 1: Create Your Professional Profile

□ Specialization *          (dropdown: Cardiology, etc.)
□ Years of Experience *     (number: 0-70)
□ Hospital/Clinic Name *    (text)
□ Professional Address *    (textarea, min 10 chars)

[Continue to Certificate Upload]
```

**Test This:**
- [ ] All fields are visible
- [ ] Fill with valid data:
  ```
  Specialization: Cardiology
  Experience: 12
  Hospital: City Medical Center
  Address: 123 Medical Ave, New York, NY 10001
  ```
- [ ] Click "Continue to Certificate Upload"
- [ ] Should move to Step 2

---

### 5️⃣ Test: Step 2 - Certificate Upload

**You should see:**
```
Step 1 ✓ Step 2 ━━━ Step 3

STEP 2: Upload Your Medical Certificate

[Drag and drop certificate here]
[Or click to select file]

Allowed: PDF, JPEG, PNG (Max 10MB)

[Upload & Request Approval]
```

**Test This:**
- [ ] File upload area visible
- [ ] Select a test file (PDF/JPEG/PNG, < 10MB)
- [ ] File preview shows
- [ ] Click "Upload & Request Approval"
- [ ] Should move to Step 3

---

### 6️⃣ Test: Step 3 - Success

**You should see:**
```
Step 1 ✓ Step 2 ✓ Step 3 ✓

✅ SUCCESS!

Your profile and certificate have been submitted successfully.
Your profile is now pending admin review.

An admin will review your credentials and notify you within 24-48 hours.

[Go to Dashboard]
```

**Test This:**
- [ ] Success message displays
- [ ] Click "Go to Dashboard"
- [ ] Should redirect to doctor dashboard

---

## 🔍 Verify in Database

After completing all 3 steps:

```sql
-- Check if profile exists WITHOUT certificate initially
SELECT * FROM doctor_profiles WHERE user_id = 2;

-- Should see: certificate_file_id = NULL after Step 1
-- Should see: certificate_file_id = <file_id> after Step 2
```

---

## ❌ Common Issues & Fixes

### Issue 1: Step 1 - Certificate file upload field appears on Step 1
**Fix**: New component should NOT have file upload on Step 1. If it does:
```bash
# Verify file was replaced
cd frontend/src/pages
cat DoctorProfileSetup.jsx | grep "file"  # Should only appear in Step 2
```

### Issue 2: Step 2 - Form doesn't move to Step 3 after upload
**Fix**: Check browser console (F12) for errors:
```
- 400: Check file validation (type, size)
- 409: Doctor already has pending/approved profile
- 500: Server error - check backend logs
```

### Issue 3: Backend console shows errors
**Check**: `npm start` output
```
- Database connection error: Verify MySQL is running
- Route error: Check that routes are loaded correctly
```

---

## 📋 Testing Checklist

### Step 1: Form Fields
- [ ] Specialization field visible (dropdown)
- [ ] Experience field visible (number 0-70)
- [ ] Hospital Name field visible (text)
- [ ] Address field visible (textarea)
- [ ] All required fields marked with *
- [ ] NO file upload field on Step 1

### Step 1: Validation
- [ ] Specialization < 3 chars → Shows error
- [ ] Experience < 0 or > 70 → Shows error
- [ ] Hospital Name < 2 chars → Shows error
- [ ] Address < 10 chars → Shows error
- [ ] All valid → Button enabled

### Step 2: File Upload
- [ ] Drag-drop area visible
- [ ] Click to select works
- [ ] File type validation (reject .doc, .txt)
- [ ] File size validation (reject > 10MB)
- [ ] Selected file shows
- [ ] Upload button enabled only with valid file

### Step 3: Success
- [ ] Success message displays
- [ ] Dashboard button works
- [ ] Redirects to doctor dashboard

### Data Storage
- [ ] Database: Profile saved without certificate after Step 1
- [ ] Database: Certificate file ID linked after Step 2
- [ ] Database: Approval request created
- [ ] Admin panel: Shows pending doctor for approval

---

## 📱 Mobile Testing

Open http://localhost:3001 on mobile or use DevTools:
- [ ] Forms are readable on mobile
- [ ] Progress indicator fits screen
- [ ] File upload works on mobile
- [ ] Buttons are touch-friendly
- [ ] No horizontal scrolling

---

## 🐛 Debug Mode

Enable logging:

**Frontend** - In browser console:
```javascript
// Check what step you're on
console.log('Current Step:', currentStep);

// Check form data
console.log('Form Data:', form);

// Check certificate file
console.log('Certificate:', certificate);
```

**Backend** - In terminal:
```bash
# Check server logs for API calls
# Look for: createDoctorProfile(), requestApproval()
# Should see: "Doctor profile created successfully"
```

---

## ✨ If Everything Works!

1. **Document Success**:
   - Save screenshots of each step
   - Note any improvements made
   - Record time taken for full flow

2. **Test Rejection & Resubmission**:
   - Go to Admin Dashboard
   - Reject the pending doctor
   - Doctor should receive email
   - When doctor logs in → Form should pre-fill

3. **Deploy**:
   - Commit changes to git
   - Deploy to production
   - Monitor for issues

---

## 📞 Need Help?

Check these docs:
- [WORKFLOW_3_STEP_PROCESS.md](./WORKFLOW_3_STEP_PROCESS.md) - Detailed workflow
- [IMPLEMENTATION_3_STEP_WORKFLOW.md](./IMPLEMENTATION_3_STEP_WORKFLOW.md) - Implementation details
- [FIX_APPROVAL_500_ERROR.md](./FIX_APPROVAL_500_ERROR.md) - Error handling
- [PROFILE_STORAGE_POLICY.md](./PROFILE_STORAGE_POLICY.md) - Data storage rules

---

## 🎯 Success Criteria

✅ **Done When:**
1. Doctor can create profile without file upload
2. Doctor can upload certificate in separate step
3. Certificate file ID is saved in database
4. Approval request is created
5. Admin can see pending doctor
6. Rejection pre-fills form
7. Doctor can resubmit

All conditions met? 🎉 **Workflow is working correctly!**
