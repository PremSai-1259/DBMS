# DEBUGGING GUIDE - Schedule Save Error 400

## Problem
Getting `400 (Bad Request)` error when trying to save schedule, and database table remains empty.

## Root Cause Analysis

The 400 error means the backend is rejecting the request data as invalid. This could be:
1. Missing or incorrectly formatted `scheduleDate`
2. `slots` array is not an array or is empty
3. `slots` array has invalid format (missing slotNumber or isAvailable)
4. Authentication failed (no doctor ID)

## Step-by-Step Debugging

### Step 1: Check Browser Console
Open DevTools (F12) and look for these logs from the frontend:

```
💾 Save button clicked
📊 Local changes: { 1: true, 2: true, 3: true }
📊 Changes count: 3
✅ Currently available slots: [1, 2, 3, ...]
📤 Sending to API:
   - selectedDate: 2026-04-19
   - slotsToSave: { 1: true, 2: true, ... }
   - availableCount: 5
📤 scheduleService.updateMultipleSlots called with:
   - scheduleDate: 2026-04-19
   - slotsObj: { 1: true, 2: true, ... }
   - slotsArray converted: [{ slotNumber: 1, isAvailable: true }, ...]
   - final request: { scheduleDate, slots: [...] }
❌ Failed to save changes: AxiosError
   Error details: [error message from backend]
```

**What to check:**
- Is `selectedDate` in format `YYYY-MM-DD`? (e.g., 2026-04-19)
- Is `slotsToSave` an object with numbers as keys?
- Is `slotsArray` properly converted to array format?
- What's the error message from backend?

### Step 2: Check Server Logs
Look at the backend terminal/console for these logs:

```
🔍 Received save request:
  doctorId: 42
  scheduleDate: 2026-04-19
  slotsReceived: [{ slotNumber: 1, isAvailable: true }, ...]
  slotsType: object
  slotsIsArray: true

📤 Sending to API:
   - selectedDate: 2026-04-19
   - slotsToSave: { 1: true, 2: true, ... }
   - availableCount: 5

✅ Formatted slots: [{ slotNumber: 1, isAvailable: true }, ...]

📅 [timestamp] Doctor 42 updating schedule for 2026-04-19
📋 Saving 5 available slots

🔌 Getting database connection...
🔌 Connection acquired, starting transaction...
🔄 Transaction started
🗑️ Delete result: { affectedRows: 0 }
📤 Inserting slot: { doctorId, slotDate, slotNum: 1, ... }
✅ Insert result for slot 1: { affectedRows: 1 }
✅ Slot 1 (08:00-08:30) saved for 2026-04-19
... (repeat for each slot)
📝 Transaction committed. Saved 5 available slots for doctor 42 on 2026-04-19

✅ Schedule save successful: { success: true, ... }
```

**If you see errors:**

#### Error: "Authentication required - no doctor ID found"
```
🔐 Auth check - Authorization header: present
❌ No doctorId in req.user: { role: undefined, id: undefined }
```
**Fix:** Token is missing or invalid fields
- Check if token is being sent in headers
- Check token contains `id` and `role` fields
- Try logging out and back in

#### Error: "scheduleDate is required"
```
🔍 Received save request:
  doctorId: 42
  scheduleDate: undefined
```
**Fix:** Date is not being sent properly
- Check if `selectedDate` prop is correct in DoctorDashboard
- Verify date format is YYYY-MM-DD

#### Error: "slots must be an array"
```
🔍 Received save request:
  slotsReceived: { 1: true, 2: true }
  slotsType: object
  slotsIsArray: false
```
**Fix:** Object is not being converted to array
- Check `scheduleService.updateMultipleSlots()` is converting properly
- Look for errors in console logs before "Sending to API"

### Step 3: Verify Database Schema

Check if the appointment_slots table has the new columns:

```sql
DESCRIBE appointment_slots;
```

Should show:
- `slot_start_time` (TIME type)
- `slot_end_time` (TIME type)

If missing, apply the migration:
```powershell
mysql -u root -p hospital_management < backend/migrations/001_add_slot_times.sql
```

### Step 4: Test with curl (Manual API Test)

```bash
curl -X POST http://localhost:3000/api/schedule/bulk \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "scheduleDate": "2026-04-19",
    "slots": [
      { "slotNumber": 1, "isAvailable": true },
      { "slotNumber": 2, "isAvailable": true }
    ]
  }'
```

Expected success response:
```json
{
  "success": true,
  "message": "Schedule saved successfully!",
  "scheduleDate": "2026-04-19",
  "totalSlotsUpdated": 2,
  "slotsAvailable": [1, 2],
  "timestamp": "2026-04-19T12:30:45.000Z"
}
```

Expected error response:
```json
{
  "error": "description of what's wrong"
}
```

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "slots must be an array" | Data format wrong | Check console logs for slotsArray conversion |
| "Invalid slot number" | Slot is 9, 10, or outside 1-24 | Toggle only valid slots |
| "No available slots" | No slots with isAvailable: true | Select at least one slot |
| "No token provided" | Authorization header missing | Check token in localStorage |
| "Cannot read property 'id' of undefined" | req.user not set by auth middleware | Check JWT_SECRET env var |
| Empty database after save | Transaction failed silently | Check server logs for errors |

## Enable Maximum Debug Mode

### Frontend: Add to ScheduleManager.jsx

```javascript
useEffect(() => {
  console.log('🎯 ScheduleManager Debug Info:');
  console.log('  selectedDate:', selectedDate);
  console.log('  slots.length:', slots.length);
  console.log('  localChanges:', localChanges);
}, [selectedDate, slots, localChanges]);
```

### Backend: Add to schedule controller

```javascript
console.log(`🎯 Request details:`, {
  path: req.path,
  method: req.method,
  headers: req.headers,
  body: req.body,
  user: req.user
});
```

## Quick Checklist

- [ ] Token is being sent in Authorization header
- [ ] Token is valid and not expired
- [ ] Token contains `id` and `role` fields
- [ ] `selectedDate` is in YYYY-MM-DD format
- [ ] At least one slot is toggled as available
- [ ] Database table has `slot_start_time` and `slot_end_time` columns
- [ ] Backend logs show "Doctor X updating schedule"
- [ ] No transaction rollback errors in logs
- [ ] Database shows inserted records after save

## Next Steps if Still Failing

1. Screenshot the browser console errors
2. Copy the server terminal output
3. Check database directly: `SELECT * FROM appointment_slots;`
4. Restart backend: `npm start`
5. Test again with different number of slots
6. Try curl test directly to API

---

**Need More Help?**
- Check IMPLEMENTATION_SUMMARY.md for system overview
- Check SCHEDULE_SAVE_DOCUMENTATION.md for technical details
- Run migration again if columns are missing
