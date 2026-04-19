# ENHANCED DEBUGGING - Schedule Save Error 400

## What I've Updated

I've added comprehensive logging throughout the entire data save flow to help identify where the 400 error originates:

### 1. **Frontend Enhancements**

**File:** `frontend/src/components/ScheduleManager.jsx`
- Enhanced `handleSaveChanges()` with detailed console logs
- Logs all currently available slots
- Logs what data is being sent to the API
- Logs API response and error details

**File:** `frontend/src/services/scheduleService.js`  
- Enhanced `updateMultipleSlots()` with logging
- Shows object-to-array conversion
- Shows final request structure before sending
- Logs all parameters and transformations

### 2. **Backend Enhancements**

**File:** `backend/middleware/authmiddleware.js`
- Enhanced authentication logging
- Shows if token is present
- Shows decoded user details (id, role, email)
- Clear indicators for auth success/failure

**File:** `backend/controllers/scheduleController.js`
- Comprehensive validation logging
- Logs each validation check with clear pass/fail indicators
- Shows received data structure
- Distinguishes between validation errors (400) and server errors (500)
- Logs successful save with response details

**File:** `backend/models/AppointmentSlot.js`
- Detailed transaction logging
- Logs database connection lifecycle
- Logs delete operation results
- Logs each insert operation
- Shows transaction commit/rollback details
- Logs connection release

### 3. **New Documentation**

**File:** `DEBUGGING_SCHEDULE_400_ERROR.md`
- Step-by-step debugging procedure
- Log interpretation guide
- Common issues and fixes
- Manual curl test examples
- Checklist for validation

## How to Test

### Step 1: Restart Backend (to ensure new code is loaded)
```bash
cd backend
npm start
```

**Expected startup logs:**
```
💾 Backend server running on port 3000
```

### Step 2: Test Schedule Save with Enhanced Logging

1. Open browser DevTools (F12)
2. Go to "Console" tab
3. Select your date and toggle some slots
4. Click "Save Changes"
5. **Copy ALL console logs** from frontend (should show data being sent)

### Step 3: Check Backend Logs

In the terminal where you ran `npm start`, look for logs like:

**Successful path:**
```
🔐 Auth check - Authorization header: present
🔐 Token received, verifying with JWT_SECRET...
🔐 Token decoded: { id: 42, role: 'doctor', email: 'doctor@email.com' }
✅ Token verified for user: 42, role: doctor

🔍 Received save request:
  doctorId: 42
  scheduleDate: 2026-04-19
  slotsReceived: [{ slotNumber: 1, isAvailable: true }, ...]
  slotsIsArray: true

✅ Formatted slots: [{ slotNumber: 1, isAvailable: true }, ...]

📅 [2026-04-19T12:30:45.000Z] Doctor 42 updating schedule for 2026-04-19
📋 Saving 5 available slots

🔌 Getting database connection...
🔌 Connection acquired, starting transaction...
🔄 Transaction started
🗑️ Delete result: { affectedRows: 0 }
📤 Inserting slot: { doctorId: 42, slotDate: 2026-04-19, slotNum: 1, ... }
✅ Insert result for slot 1: { affectedRows: 1 }
✅ Slot 1 (08:00-08:30) saved for 2026-04-19

📝 Transaction committed. Saved 5 available slots for doctor 42 on 2026-04-19
✅ Schedule save successful: { success: true, ... }
```

**Failure path (example):**
```
❌ No token provided in Authorization header
```
OR
```
🔐 Token received, verifying with JWT_SECRET...
❌ Token verification failed: invalid signature
```
OR
```
🔍 Received save request:
  doctorId: undefined
❌ No doctorId in req.user: { role: undefined, id: undefined }
```

### Step 4: Verify Database

Check if data was actually saved:
```sql
SELECT * FROM appointment_slots 
WHERE doctor_id = 42 AND slot_date = '2026-04-19';
```

Should show rows with:
- doctor_id = 42
- slot_date = 2026-04-19
- slot_number = 1, 2, 3, etc (the ones you selected)
- slot_start_time = 08:00, 08:30, 09:00, etc
- slot_end_time = 08:30, 09:00, 09:30, etc
- is_available = 1 (TRUE)
- is_booked = 0 (FALSE)

## Debugging Flowchart

```
START: Click "Save Changes"
  ↓
Frontend Console: "Save button clicked"?
  ├─ NO → Frontend not even receiving click, check click handler
  ├─ YES → Continue
  ↓
Frontend Console: Shows slotsToSave object?
  ├─ NO → localChanges not being tracked, check handleToggleSlot
  ├─ YES → Continue
  ↓
Frontend Console: "Sending to API" message?
  ├─ NO → Error before API call, check available slots
  ├─ YES → Continue
  ↓
Frontend Console: "final request" shows correct format?
  ├─ NO → Data conversion error, check scheduleService
  ├─ YES → Continue
  ↓
Backend Logs: Auth check message appears?
  ├─ NO → Request not reaching backend, check network
  ├─ YES → Continue
  ↓
Backend Logs: "Token verified" message?
  ├─ NO → Auth failure, check token/JWT_SECRET
  ├─ YES → Continue
  ↓
Backend Logs: "Received save request" shows data?
  ├─ NO → Request parsing error, check request headers
  ├─ YES → Continue
  ↓
Backend Logs: "Formatted slots" message?
  ├─ NO → Validation error, check error message above
  ├─ YES → Continue
  ↓
Backend Logs: Transaction logs appear?
  ├─ NO → Database error, check connection
  ├─ YES → Continue
  ↓
Backend Logs: "Schedule save successful" message?
  ├─ NO → Database insert failed, check logs
  ├─ YES → Success! Continue
  ↓
Database Check: SELECT shows new rows?
  ├─ NO → Data rolled back, check transaction logs
  ├─ YES → ✅ SUCCESS - Save complete
```

## If You Get 400 Error

### The 400 error means "Bad Request" - your data is invalid

**Most common causes:**

1. **Missing Authentication Token**
   - Frontend logs: No request sent
   - Backend logs: "No token provided"
   - Fix: Check token is in localStorage, try login again

2. **Authentication Failed**
   - Frontend logs: API returns 401/403
   - Backend logs: "Token verification failed"
   - Fix: Check JWT_SECRET is same everywhere, token not expired

3. **Wrong Date Format**
   - Frontend logs: selectedDate shows wrong format
   - Backend logs: "scheduleDate is required"
   - Fix: Ensure YYYY-MM-DD format (e.g., 2026-04-19)

4. **Slots Data Wrong Format**
   - Frontend logs: slotsArray shows wrong structure
   - Backend logs: "slots must be an array"
   - Fix: Check conversion in scheduleService.js

5. **Invalid Slot Numbers**
   - Backend logs: "Invalid slot number" or "Slot is lunch break"
   - Frontend logs: Shows slot 9 or 10 was toggled
   - Fix: Don't toggle slots 9-10, don't use numbers outside 1-24

## Quick Test Script

Create a test file to manually verify the API works:

**File:** `test-schedule-save.js`
```javascript
const axios = require('axios');

async function testScheduleSave() {
  try {
    // Get your token (from browser localStorage)
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
    
    const response = await axios.post(
      'http://localhost:3000/api/schedule/bulk',
      {
        scheduleDate: '2026-04-19',
        slots: [
          { slotNumber: 1, isAvailable: true },
          { slotNumber: 2, isAvailable: true },
          { slotNumber: 3, isAvailable: true }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Success:', response.data);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testScheduleSave();
```

Run with: `node test-schedule-save.js`

## Next Steps

1. **Test schedule save** with the new logging
2. **Collect console output** from both frontend and backend
3. **Check database** to see if rows were created
4. **Share logs** if the issue persists

---

**All changes are non-breaking:** The logging is additive and won't change functionality. The frontend UI and API responses remain the same, just with better visibility into what's happening.

**Performance impact:** Minimal - console.log is negligible in production.

**To disable logging in production:** Set `NODE_ENV=production` and add conditions like `if (process.env.NODE_ENV !== 'production') console.log(...)`
