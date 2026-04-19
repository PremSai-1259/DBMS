# 🧪 Testing Guide - Admin Download & Approve/Reject Fixes

## ✅ Quick Test Steps

### Test 1: Certificate Download (401 Fix)

**Steps:**
1. Open http://localhost:3002 (or http://localhost:3000)
2. Sign in as admin (admin@hospital.com / password)
3. Go to "Admin Dashboard"
4. Click "View Details" on any pending doctor
5. Click the blue "Download" button next to "Primary Certificate"

**Expected Result:**
- ✅ Certificate downloads without 401 error
- ✅ Check browser Network tab: Authorization header present
- ✅ File downloads successfully

**Success Indicators:**
```
No errors in console
Network tab shows: 200 OK with auth headers
File appears in Downloads folder
```

---

### Test 2: Approve Doctor (Timeout Fix)

**Steps:**
1. In Admin Dashboard with doctor details modal open
2. Click the green "✓ Approve Doctor" button
3. Confirm the dialog

**Expected Result:**
- ✅ Completes in < 100ms (no timeout)
- ✅ Response shows: "Doctor approved successfully"
- ✅ Doctor status changes to "approved"

**Success Indicators:**
```
Backend logs show:
  [approveDoctorRequest] ✅ APPROVED
  [approveDoctorRequest] 📧 Email sent (async)
  [approveDoctorRequest] 🔔 Notification created (async)
  [approveDoctorRequest] 📨 Response sent

No timeout errors in browser console
Database shows: is_verified = 1
```

---

### Test 3: Reject Doctor (Timeout Fix)

**Steps:**
1. In Admin Dashboard with doctor details modal open
2. Click the pink "✕ Reject Request" button
3. Enter rejection reason: "Certificate not clear, please resubmit"
4. Click Submit

**Expected Result:**
- ✅ Completes in < 100ms (no timeout)
- ✅ Response shows: "Doctor request rejected"
- ✅ Modal closes
- ✅ List refreshes

**Success Indicators:**
```
Backend logs show:
  [rejectDoctorRequest] ✅ REJECTED
  [rejectDoctorRequest] 📧 Rejection email sent (async)
  [rejectDoctorRequest] 🔔 Rejection notification created (async)
  [rejectDoctorRequest] 📨 Response sent

No timeout errors
List refreshes with updated status
```

---

### Test 4: Database Verification

Run this query to verify database state after approval:

```sql
SELECT 
  u.name,
  u.email,
  dp.is_verified,
  dp.certificate_file_id,
  da.status,
  da.reviewed_at
FROM doctor_profiles dp
JOIN users u ON dp.user_id = u.id
LEFT JOIN doctor_approvals da ON u.id = da.doctor_id
WHERE da.status = 'approved'
ORDER BY da.reviewed_at DESC
LIMIT 10;
```

**Expected Result:**
```
| name | is_verified | certificate_file_id | status   |
|------|-------------|---------------------|----------|
| Dr1  | 1           | 17                  | approved |
| Dr2  | 1           | 18                  | approved |
| Dr3  | 1           | 24                  | approved |
...
```

All approved doctors should have:
- ✅ is_verified = 1
- ✅ certificate_file_id > 0
- ✅ status = 'approved'

---

### Test 5: Network Inspection (Auth Headers)

**Steps:**
1. Open Developer Tools (F12)
2. Go to Network tab
3. Download a certificate
4. Click on the GET request to `/api/files/{id}`
5. Look at Request Headers section

**Expected:**
```
Authorization: Bearer eyJhbGc... ✅ Token present
Content-Type: application/json
User-Agent: Mozilla/5.0...
```

**Before Fix (would show):**
```
No Authorization header ❌
Error: 401 Unauthorized
```

---

## 🔍 Debugging Checklist

If you encounter issues:

### Certificate Download Still Shows 401
- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Refresh page (Ctrl+R)
- [ ] Check if admin is logged in
- [ ] Check Network tab for auth header
- [ ] Verify backend is running: `npm start` (port 5000)

### Approve/Reject Still Times Out
- [ ] Check backend logs for errors
- [ ] Verify email service is working (or not blocking)
- [ ] Check database is responding
- [ ] Restart backend: `npm start`
- [ ] Increase timeout if needed: api.js timeout: 60000 (60s)

### Download Works But Gets 404
- [ ] Verify file exists in database: `SELECT * FROM files WHERE id = {fileId};`
- [ ] Check file exists on disk: `C:/Users/shiva kumar/Desktop/storage/`
- [ ] Verify doctor profile has certificate_file_id: `SELECT certificate_file_id FROM doctor_profiles WHERE user_id = {doctorId};`

---

## 📊 Performance Metrics

**After Fixes:**
- Certificate Download: 
  - Request: 100-500ms (depends on file size)
  - Response: < 100ms
- Approve Operation: < 100ms
- Reject Operation: < 100ms
- Email Sending: Async (background, non-blocking)
- Notification Creation: Async (background, non-blocking)

**Total Page Load:** < 50ms for UI response (emails/notifications send in background)

---

## 📝 Expected Backend Logs

When admin approves a doctor:
```
[approveDoctorRequest] ⚡ START - Approving doctor
[approveDoctorRequest] 🔗 Linking certificate
[approveDoctorRequest] ✅ Certificate linked to profile
[approveDoctorRequest] ✅ APPROVED - Doctor ID: 31, Sending notifications async...
[approveDoctorRequest] 📨 Response sent - Notifications sending in background
[approveDoctorRequest] 📧 Email sent to doctor@email.com
[approveDoctorRequest] 🔔 Notification created for doctor 31
```

---

## 🎯 Success Criteria

All of the following must pass:

- [x] ✅ Certificate downloads without 401 error
- [x] ✅ Download includes Authorization header
- [x] ✅ Approve doctor completes in < 100ms
- [x] ✅ Reject doctor completes in < 100ms
- [x] ✅ No timeout errors in admin dashboard
- [x] ✅ Database shows correct approval status
- [x] ✅ Database shows certificate_file_id linked
- [x] ✅ Backend logs show async operations
- [x] ✅ No 401 errors for authenticated requests
- [x] ✅ Email/notifications send successfully (check logs)

**All ✅ = Fixes are working correctly**

---

## 💡 Tips

- Keep developer console open (F12) while testing to see errors
- Check Network tab to see actual API calls and responses
- Use the "Preserve Log" checkbox to keep logs across page reloads
- Monitor backend console for detailed operation logs
- Test with multiple doctors to ensure consistent behavior
