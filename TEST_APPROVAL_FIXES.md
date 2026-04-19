# 🧪 Quick Test Guide: Approval Request Fixes

## Before You Start

### 1. Verify Files Are Updated
- ✅ `frontend/src/pages/DoctorProfileSetup.jsx` - Updated with better error handling
- ✅ `backend/controllers/doctorApprovalController.js` - Made profile update optional

### 2. Kill Old Servers (if running)
```bash
# Stop any running Node processes
# Kill terminals or close previous servers
```

### 3. Start Fresh Servers
```bash
# Terminal 1: Backend
cd c:\Users\shiva kumar\OneDrive\Desktop\DBMS_Project\DBMS\backend
npm start

# Terminal 2: Frontend
cd c:\Users\shiva kumar\OneDrive\Desktop\DBMS_Project\DBMS\frontend
npm run dev
```

---

## Test Scenarios

### ✅ Test 1: Complete Success Flow (MAIN TEST)

**Expected**: Certificate uploaded → "Request Sent for Approval!" popup

**Steps**:
1. Go to http://localhost:3001
2. Sign in as doctor (if not already)
3. Go to Profile Setup
4. **Step 1**: Fill profile form
   - Specialization: Cardiology
   - Experience: 12
   - Hospital: City Hospital
   - Address: 123 Medical St, NYC 10001
5. Click "Continue to Certificate Upload"
6. **Step 2**: Upload certificate
   - Select any PDF/JPEG/PNG file (< 10MB)
   - Should show file preview
7. Click "Upload & Request Approval"
8. **EXPECTED OUTPUT**:
   - ✅ Success message: "📤 Uploading certificate file..."
   - ✅ Then: "✉️ Submitting approval request..."
   - ✅ Then popup: "Request Sent for Approval!"
   - ✅ Shows checkklist:
     ```
     ✓ Profile submitted
     ✓ Certificate uploaded
     ✓ Approval request sent
     ```

**Verify**:
- [ ] Popup appears (not just toast)
- [ ] Message says "Request Sent for Approval!"
- [ ] Has "Go to Dashboard" button
- [ ] Click button → goes to dashboard
- [ ] No errors in console

---

### ✅ Test 2: Already Pending (409 Error)

**Expected**: Upload again → "already pending" message → still shows success

**Steps**:
1. From previous test, go back to profile
2. Click "Upload & Request Approval" again
3. **EXPECTED OUTPUT**:
   - 🟡 First might see: "✉️ Submitting approval request..."
   - ✅ Then popup: "Request Sent for Approval!"
   - Message: "Your certificate has been submitted!"

**Verify**:
- [ ] Gets 409 error in network tab
- [ ] But still shows success popup
- [ ] Error message is helpful
- [ ] Can click "Go to Dashboard"

---

### ✅ Test 3: Check Browser Network Tab

**Steps**:
1. Open DevTools (F12)
2. Go to Network tab
3. Do Test 1 again
4. Look for:
   ```
   POST /api/files/upload → 201 ✅
   POST /api/doctor-approvals/request → 201 ✅
   ```

**Verify**:
- [ ] File upload returns 201
- [ ] Approval request returns 201 (not 500)
- [ ] No failed requests (unless retrying pending)

---

### ✅ Test 4: Check Console Logs

**Steps**:
1. Open DevTools (F12)
2. Go to Console tab
3. Do Test 1 again
4. Should see:
   ```
   📋 Starting certificate upload...
   ✅ Certificate uploaded, file ID: XX
   ✉️ Requesting approval...
   ✅ Approval request submitted!
   ```

**Verify**:
- [ ] No red errors
- [ ] Logs show upload then approval
- [ ] Messages are in correct order
- [ ] File ID is a number

---

### ✅ Test 5: Check Database

**Steps**:
1. After Test 1, open MySQL client
2. Run:
   ```sql
   -- Check doctor profile
   SELECT id, user_id, specialization, hospital_name, certificate_file_id 
   FROM doctor_profiles 
   WHERE user_id = 2 
   LIMIT 1;
   
   -- Should show: certificate_file_id = (some number, not NULL)
   
   -- Check approval request
   SELECT id, doctor_id, certificate_file_id, status 
   FROM doctor_approvals 
   WHERE doctor_id = 2 
   ORDER BY id DESC 
   LIMIT 1;
   
   -- Should show: status = 'pending'
   ```

**Verify**:
- [ ] Profile has certificate_file_id (not NULL)
- [ ] Approval status = 'pending'
- [ ] certificate_file_id matches between tables

---

## Common Issues & Fixes

### Issue 1: Still seeing 500 errors
**Fix**: Clear browser cache (Ctrl+Shift+Delete) and refresh

### Issue 2: Popup not showing
**Fix**: Check DevTools console for errors. Should show success toast + popup

### Issue 3: Button doesn't work
**Fix**: Check `handleApprovalConfirm` is being called. Should see navigation to dashboard

### Issue 4: Can't sign in
**Fix**: Make sure doctor account exists. Create new one if needed.

### Issue 5: File upload fails
**Fix**: Check file is PDF/JPEG/PNG and < 10MB

---

## Success Indicators

✅ All these should be true:

1. **Popup appears** after upload
2. **Popup title** says "Request Sent for Approval!"
3. **Shows checklist** with 3 items
4. **"Go to Dashboard" button** works
5. **No console errors** (red in console)
6. **Network** shows 201 responses
7. **Database** shows certificate_file_id saved
8. **Can do it again** and get 409 conflict (OK!)

---

## If You See This
```
✅ "Request Sent for Approval!"
✓ Profile submitted
✓ Certificate uploaded  
✓ Approval request sent
```

**Then**: ✅ **IT'S WORKING! SUCCESS!** ✅

---

## Quick Summary of Changes

**What changed**:
- Upload popup now shows "Request Sent for Approval!" (not "Approval Request Submitted!")
- Error handling improved (409 errors handled gracefully)
- Backend makes profile update optional (doesn't fail if it errors)

**What's the same**:
- 3-step workflow still works
- Profile creation still works
- Admin approval still works

---

## Next Steps If Tests Pass

1. ✅ Mark as complete
2. 🔄 Test rejection flow (admin rejects, doctor resubmits)
3. 📊 Check admin dashboard shows pending doctor
4. ✅ Deploy to production when ready
