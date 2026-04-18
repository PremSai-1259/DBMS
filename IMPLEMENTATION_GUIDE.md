# Doctor Approval System - Implementation Guide

## Quick Start

### 1. Database Migration
Run the updated schema to apply changes:

```bash
# Back up current database first
mysql -u root -p hospital_db < hospital_db_backup.sql

# Apply new schema
mysql -u root -p hospital_db < backend/configs/schema.sql
```

### 2. No Package Installation Required
All changes are within existing code - no new dependencies needed.

### 3. Restart Backend
```bash
cd backend
npm start
# Server should start without errors
```

### 4. Test the Flow

#### Test 1: Initial Doctor Setup
1. Register as doctor
2. Go to `/doctor-profile` route
3. Fill all fields + upload certificate
4. Submit for approval
5. Should see "Profile Under Review" screen

#### Test 2: Admin Approval
1. Login as admin
2. Go to Admin Dashboard
3. Click "View Certificate"
4. Click "Approve"
5. Doctor should receive approval email

#### Test 3: Admin Rejection
1. As admin, reject a pending doctor
2. Provide detailed feedback (min 10 chars)
3. Doctor should receive rejection email with feedback

#### Test 4: Doctor Resubmission
1. As rejected doctor, go to dashboard
2. See rejection reason
3. Click "Update Profile"
4. Form should pre-fill with previous data + show reason
5. Upload new certificate
6. Click "Resubmit Profile for Approval"
7. Should show "Resubmission Sent" message

---

## Code Changes Overview

### Backend Files Modified
```
backend/
├── configs/schema.sql                    ✅ UPDATED
├── models/DoctorApproval.js             ✅ UPDATED
├── controllers/doctorApprovalController.js ✅ UPDATED
└── routes/doctorApprovalsRoutes.js      ✅ UPDATED
```

### Frontend Files Modified
```
frontend/src/
├── pages/DoctorProfileSetup.jsx         ✅ UPDATED
├── pages/DoctorDashboard.jsx            ✅ UPDATED
└── pages/AdminDashboard.jsx             ✅ UPDATED
```

### Files NOT Modified (Working Features)
- Authentication system
- File upload system
- Appointment management
- Patient profiles
- Notification system (already integrated)
- Email sending (already integrated)

---

## What Changed & Why

### Database Schema
**Before**: UNIQUE constraint prevented resubmission
**After**: Allows multiple submissions with status-based tracking

### DoctorApproval Model
**Before**: Single record per doctor
**After**: Multiple records allowed, latest status queried efficiently

### Approval Controller
**Before**: Blocked on UNIQUE constraint violation
**After**: Checks status instead, allows resubmission when appropriate

### Doctor Dashboard
**Before**: Only pending state
**After**: Pending, Rejected (with feedback), Approved states

### Doctor Profile Setup
**Before**: Only for new profiles
**After**: Also handles resubmission after rejection

### Admin Dashboard
**Before**: Basic list
**After**: Enhanced with more doctor info and status tracking

---

## Important Notes

### 1. Data Integrity
- `is_verified` flag in `doctor_profiles` is the source of truth for dashboard access
- Admin approval sets this flag to TRUE
- Admin rejection leaves it as FALSE
- Doctor can only see full dashboard when `is_verified = TRUE`

### 2. Email Notifications
Already implemented - will automatically send:
- Approval notification
- Rejection notification with reason
- Resubmission acknowledged

### 3. Backward Compatibility
- All changes are backward compatible
- Existing approved doctors remain approved
- No data loss during migration
- Old rejection records preserved for history

### 4. Performance
- Indexes added for fast queries:
  - `idx_doctor_status`: For checking latest status
  - `idx_status`: For admin pending list
- No N+1 queries

### 5. Security
- Role-based access control maintained
- Doctor can only see own approvals
- Admin can see all pending approvals
- All endpoints authenticated

---

## Troubleshooting

### Issue: "Database table already exists"
```bash
# If running schema.sql on existing DB
# The CREATE TABLE won't run twice - that's expected
# The indexes and changes will be applied if not existing
```

### Issue: Doctor can't find profile after rejection
**Solution**: Profile is still there with `is_verified = FALSE`. Check:
```sql
SELECT * FROM doctor_profiles WHERE user_id = ?;
SELECT * FROM doctor_approvals WHERE doctor_id = ? ORDER BY id DESC;
```

### Issue: Resubmission fails with "already has pending"
**Expected**: Doctor already submitted before. Wait for admin review.
**Solution**: Admin needs to approve or reject the existing request first.

### Issue: Certificate won't upload
**Check**:
- File size < 10MB
- File type is PDF, JPEG, or PNG
- Server has write permissions to `/backend/uploads`

### Issue: Admin doesn't see updated info
**Solution**: Clear browser cache and refresh dashboard
```
Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
```

---

## Database Queries for Debugging

### Find all doctors in approval workflow
```sql
SELECT 
  u.id, u.name, u.email,
  dp.specialization, dp.is_verified,
  da.id as approval_id, da.status, da.submitted_at, da.admin_message
FROM users u
LEFT JOIN doctor_profiles dp ON u.id = dp.user_id
LEFT JOIN doctor_approvals da ON u.id = da.doctor_id
WHERE u.role = 'doctor'
ORDER BY da.submitted_at DESC;
```

### Find all pending approvals
```sql
SELECT * FROM doctor_approvals WHERE status = 'pending' ORDER BY submitted_at DESC;
```

### Find all rejections
```sql
SELECT * FROM doctor_approvals WHERE status = 'rejected' ORDER BY submitted_at DESC;
```

### Check doctor approval history
```sql
SELECT * FROM doctor_approvals WHERE doctor_id = ? ORDER BY id DESC;
```

### Fix: Reset a doctor's approval (if needed)
```sql
-- CAUTION: Only if necessary
UPDATE doctor_profiles SET is_verified = FALSE WHERE user_id = ?;
DELETE FROM doctor_approvals WHERE doctor_id = ?;
-- Doctor can now resubmit
```

---

## File Upload Directory

Make sure this directory exists and is writable:
```
backend/
└── uploads/
    ├── certificates/
    ├── medical_reports/
    └── profile_images/
```

The system will create these automatically, but ensure `backend/uploads` has write permissions:
```bash
chmod 755 backend/uploads
```

---

## Email Template Changes

Emails are sent automatically via the notification system. Templates include:
- Doctor Approved: "Your doctor profile has been approved!"
- Doctor Rejected: "Your application was declined. Reason: {reason}"
- Doctor Resubmitted: "Your resubmission has been received"

Edit these in `backend/utils/helpers.js` if needed.

---

## API Testing with cURL

### Check Status
```bash
curl -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/doctor-approvals/status
```

### Request Approval
```bash
curl -X POST \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"certificateFileId": 100}' \
  http://localhost:5000/api/doctor-approvals/request
```

### Admin: Get Pending
```bash
curl -H "Authorization: Bearer {admin_token}" \
  http://localhost:5000/api/doctor-approvals/pending
```

### Admin: Approve
```bash
curl -X PUT \
  -H "Authorization: Bearer {admin_token}" \
  http://localhost:5000/api/doctor-approvals/1/approve
```

### Admin: Reject
```bash
curl -X PUT \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"adminMessage": "Certificate validation failed"}' \
  http://localhost:5000/api/doctor-approvals/1/reject
```

---

## Deployment Checklist

- [ ] Backup existing database
- [ ] Run schema migration
- [ ] Restart backend server
- [ ] Clear frontend cache
- [ ] Test doctor registration → submission → approval flow
- [ ] Test rejection → resubmission flow
- [ ] Verify emails are sending
- [ ] Check database for any errors
- [ ] Monitor server logs for issues
- [ ] All existing features still work

---

## Support & Questions

For issues or questions about the implementation:
1. Check [DOCTOR_APPROVAL_FIX_SUMMARY.md](./DOCTOR_APPROVAL_FIX_SUMMARY.md) for detailed docs
2. Review the API endpoints section above
3. Check database queries for debugging
4. Look at frontend components for UI logic
5. Check server logs: `backend/logs/` or console output

