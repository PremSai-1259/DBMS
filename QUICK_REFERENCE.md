# 🚀 Quick Reference: 3-Step Workflow

## What Changed

```
BEFORE:  1 Form (Profile + File Upload)
AFTER:   3 Steps (Profile → File → Success)
```

## Files Modified

```
Frontend:  frontend/src/pages/DoctorProfileSetup.jsx ✅
Backend:   backend/controllers/profilecontroller.js ✅
Database:  NO CHANGES (backward compatible) ✅
```

## The 3 Steps

```
STEP 1: Create Profile
├─ Fields: Specialization, Experience, Hospital, Address
├─ File Upload: NO ✅ (Removed)
└─ Action: Continue → Step 2

STEP 2: Upload Certificate
├─ Fields: File upload only
├─ File Types: PDF, JPEG, PNG (max 10MB)
└─ Action: Upload & Request Approval → Step 3

STEP 3: Success
├─ Shows: Submitted information
├─ Status: "Pending admin review"
└─ Action: Go to Dashboard
```

## Quick Test

```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend (new terminal)
cd frontend
npm run dev

# Open browser
http://localhost:3001

# Test:
1. Sign up as doctor
2. Fill Step 1 (profile)
3. Fill Step 2 (certificate)
4. See Step 3 (success)
5. Check database
```

## Database Check

```sql
-- After Step 1 (profile created, no certificate)
SELECT * FROM doctor_profiles WHERE user_id = <doctor_id>;
-- Should show: certificate_file_id = NULL

-- After Step 2 (certificate uploaded)
SELECT * FROM doctor_profiles WHERE user_id = <doctor_id>;
-- Should show: certificate_file_id = <file_id>
```

## Key Features

✅ Progress indicator (1 ━━━ 2 ━━━ 3)
✅ Rejection pre-fills form
✅ Shows rejection reason
✅ Resubmission support
✅ Better error messages
✅ Mobile-friendly

## Error Messages

| Error | Message | Status |
|-------|---------|--------|
| Wrong file | "Only PDF/JPEG/PNG" | 400 |
| File too big | "Max 10MB" | 400 |
| Already pending | "Profile pending review" | 409 |
| Already approved | "Already approved" | 409 |
| Server error | "Try again later" | 500 |

## Documentation Files

```
WORKFLOW_3_STEP_PROCESS.md         ← Detailed workflow
IMPLEMENTATION_3_STEP_WORKFLOW.md  ← Implementation details
UI_FLOW_VISUAL_GUIDE.md            ← Visual mockups
TEST_3_STEP_WORKFLOW.md            ← Testing guide
3_STEP_WORKFLOW_SUMMARY.md         ← Full summary
```

## Rejection & Resubmission

```
1. Admin rejects doctor
2. Doctor gets email with reason
3. Doctor logs in → Form pre-filled ✅
4. Doctor updates profile (if needed)
5. Doctor uploads new certificate
6. New approval request sent
```

## Success Indicators

✅ Step 1 form displays (no file field)
✅ Step 2 file upload appears
✅ Step 3 success message shows
✅ Database profile saved
✅ Database certificate linked
✅ Admin sees pending doctor

## Next Steps

1. [ ] Start servers (npm start, npm run dev)
2. [ ] Test new doctor signup
3. [ ] Verify database saves
4. [ ] Test admin approval/rejection
5. [ ] Test resubmission
6. [ ] Deploy to production

## Need Help?

- See `TEST_3_STEP_WORKFLOW.md` for detailed testing
- See `UI_FLOW_VISUAL_GUIDE.md` for visual mockups
- See `WORKFLOW_3_STEP_PROCESS.md` for workflow details

---

**Status**: ✅ Implementation Complete - Ready for Testing
