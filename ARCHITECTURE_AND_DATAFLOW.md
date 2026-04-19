# Data Flow Architecture - Schedule Save

## Complete Request Flow with Logging Points

```
┌─────────────────────────────────────────────────────────────────────┐
│                     DOCTOR SAVES SCHEDULE                            │
└─────────────────────────────────────────────────────────────────────┘
                               ↓
         ┌──────────────────────────────────────────┐
         │   FRONTEND: ScheduleManager.jsx          │
         │   handleSaveChanges() function           │
         └──────────────────────────────────────────┘
                               ↓
         ✅ LOG: 💾 Save button clicked
         ✅ LOG: 📊 Local changes: { 1: true, 2: true, 3: true }
         ✅ LOG: 📊 Changes count: 3
         ✅ LOG: ✅ Currently available slots: [1, 2, 3, ...]
                               ↓
         Build slotsToSave = { 1: true, 2: true, 3: true }
                               ↓
         ✅ LOG: 📤 Sending to API:
                     - selectedDate: 2026-04-19
                     - slotsToSave: { 1: true, 2: true, 3: true }
                               ↓
         ┌──────────────────────────────────────────┐
         │   FRONTEND: scheduleService.js           │
         │   updateMultipleSlots() method           │
         └──────────────────────────────────────────┘
                               ↓
         ✅ LOG: 📤 scheduleService.updateMultipleSlots called with:
                    - scheduleDate: 2026-04-19
                    - slotsObj: { 1: true, 2: true, 3: true }
                               ↓
         Convert object to array:
         { 1: true, 2: true } → 
         [{ slotNumber: 1, isAvailable: true }, 
          { slotNumber: 2, isAvailable: true }]
                               ↓
         ✅ LOG: 📤 slotsArray converted: [...]
         ✅ LOG: 📤 final request: { scheduleDate, slots: [...] }
                               ↓
         POST to /api/schedule/bulk with:
         {
           "scheduleDate": "2026-04-19",
           "slots": [
             { "slotNumber": 1, "isAvailable": true },
             { "slotNumber": 2, "isAvailable": true },
             { "slotNumber": 3, "isAvailable": true }
           ]
         }
                               ↓
         ┌──────────────────────────────────────────┐
         │   NETWORK REQUEST                        │
         │   POST http://localhost:3000/           │
         │        api/schedule/bulk                 │
         └──────────────────────────────────────────┘
                               ↓
         ┌──────────────────────────────────────────┐
         │   BACKEND: Express Middleware Stack      │
         │   1. Authentication Check                │
         └──────────────────────────────────────────┘
                               ↓
         ┌──────────────────────────────────────────┐
         │   BACKEND: authmiddleware.js             │
         │   Verify JWT Token                       │
         └──────────────────────────────────────────┘
                               ↓
         ✅ LOG: 🔐 Auth check - Authorization header: present
         ✅ LOG: 🔐 Token received, verifying with JWT_SECRET...
                               ↓
         Extract token from "Bearer <token>" format
         Verify JWT signature with JWT_SECRET
                               ↓
         ✅ LOG: 🔐 Token decoded: 
                    { id: 42, role: 'doctor', email: 'doctor@email.com' }
                               ↓
         Set req.user = decoded
                               ↓
         ✅ LOG: ✅ Token verified for user: 42, role: doctor
                               ↓
         Call next() → proceed to controller
                               ↓
         ┌──────────────────────────────────────────┐
         │   BACKEND: scheduleController.js         │
         │   updateMultipleSlots() handler          │
         └──────────────────────────────────────────┘
                               ↓
         Get doctorId from req.user.id (= 42)
         Get scheduleDate from req.body (= "2026-04-19")
         Get slots from req.body (= array of slot objects)
                               ↓
         ✅ LOG: 🔍 Received save request:
                    doctorId: 42
                    scheduleDate: 2026-04-19
                    slotsReceived: [...]
                    slotsIsArray: true
                               ↓
         ┌─ VALIDATION STAGE ─┐
         │ Check each field   │
         └────────────────────┘
                               ↓
         ✓ doctorId exists? YES
         ✓ scheduleDate provided? YES
         ✓ slots is array? YES
         ✓ slots not empty? YES
                               ↓
         For each slot:
         ✓ Has slotNumber? YES
         ✓ slotNumber is integer? YES
         ✓ In range 1-24? YES
         ✓ Not lunch break (9-10)? YES
         ✓ Has isAvailable? YES
                               ↓
         ✅ LOG: ✅ Formatted slots: 
                    [{ slotNumber: 1, isAvailable: true }, ...]
                               ↓
         ✓ At least one available slot? YES
                               ↓
         ✅ LOG: 📅 Doctor 42 updating schedule for 2026-04-19
         ✅ LOG: 📋 Saving 3 available slots
                               ↓
         ┌──────────────────────────────────────────┐
         │   BACKEND: AppointmentSlot.js Model      │
         │   updateMultipleSlots() method           │
         │   Database Operation                     │
         └──────────────────────────────────────────┘
                               ↓
         ✅ LOG: 📋 updateMultipleSlots called:
                    doctorId: 42
                    slotDate: 2026-04-19
                    totalSlots: 3
                    slots: [...]
                               ↓
         ✅ LOG: ✅ Available slots to save: [...]
                               ↓
         ✅ LOG: 🔌 Getting database connection...
         Get connection from pool
         ✅ LOG: 🔌 Connection acquired, starting transaction...
         ✅ LOG: 🔄 Transaction started
                               ↓
         ┌─ DELETE OLD SLOTS ─┐
                               ↓
         SQL: DELETE FROM appointment_slots 
              WHERE doctor_id = 42 
              AND slot_date = '2026-04-19'
                               ↓
         ✅ LOG: 🗑️ Executing delete query: { doctorId: 42, slotDate: '2026-04-19' }
         ✅ LOG: 🗑️ Delete result: { affectedRows: 0 }
         (0 rows because this is first save for this date)
                               ↓
         ┌─ INSERT NEW SLOTS ─┐
                               ↓
         SQL: INSERT INTO appointment_slots 
              (doctor_id, slot_date, slot_number, slot_start_time, 
               slot_end_time, is_available, is_booked)
              VALUES (42, '2026-04-19', 1, '08:00', '08:30', TRUE, FALSE)
                               ↓
         ✅ LOG: 📤 Inserting slot: 
                    { doctorId: 42, slotDate: '2026-04-19', slotNum: 1, ... }
         ✅ LOG: ✅ Insert result for slot 1: { affectedRows: 1 }
         ✅ LOG: ✅ Slot 1 (08:00-08:30) saved for 2026-04-19
                               ↓
         Repeat for slots 2, 3...
                               ↓
         ✅ LOG: ✅ Slot 2 (08:30-09:00) saved for 2026-04-19
         ✅ LOG: ✅ Slot 3 (09:00-09:30) saved for 2026-04-19
                               ↓
         ┌─ COMMIT TRANSACTION ─┐
                               ↓
         ✅ LOG: 💾 All inserts complete, committing transaction...
         COMMIT (all changes permanent in database)
         ✅ LOG: 📝 Transaction committed. Saved 3 available slots 
                     for doctor 42 on 2026-04-19
                               ↓
         ✅ LOG: 🔌 Releasing connection...
         Return connection to pool
         ✅ LOG: 🔌 Connection released
                               ↓
         ┌──────────────────────────────────────────┐
         │   Return to scheduleController.js        │
         │   Build Success Response                 │
         └──────────────────────────────────────────┘
                               ↓
         Build response:
         {
           success: true,
           message: "Schedule saved successfully!",
           scheduleDate: "2026-04-19",
           totalSlotsUpdated: 3,
           slotsAvailable: [1, 2, 3],
           timestamp: "2026-04-19T12:30:45.000Z"
         }
                               ↓
         ✅ LOG: ✅ Schedule save successful: { success: true, ... }
                               ↓
         Return HTTP 200 with response
                               ↓
         ┌──────────────────────────────────────────┐
         │   NETWORK RESPONSE                       │
         │   HTTP 200 OK                            │
         │   Response Body: JSON success response   │
         └──────────────────────────────────────────┘
                               ↓
         ┌──────────────────────────────────────────┐
         │   FRONTEND: scheduleService.js           │
         │   Axios Response Handler                 │
         └──────────────────────────────────────────┘
                               ↓
         Response received with status 200
         Parse JSON response
                               ↓
         Return promise with success data
                               ↓
         ┌──────────────────────────────────────────┐
         │   FRONTEND: ScheduleManager.jsx          │
         │   .then() handler                        │
         └──────────────────────────────────────────┘
                               ↓
         Show success message to user
         Update UI to reflect saved schedule
         Clear localChanges state
                               ↓
         ✅ LOG: ✅ Schedule saved successfully!
                               ↓
         ┌──────────────────────────────────────────┐
         │   DATABASE: appointment_slots table      │
         │   Contains new rows:                     │
         │                                          │
         │   id  doctor_id  slot_date   slot_num   │
         │   1   42         2026-04-19  1          │
         │   2   42         2026-04-19  2          │
         │   3   42         2026-04-19  3          │
         └──────────────────────────────────────────┘
                               ↓
                        ✅ SUCCESS!
```

---

## Failure Points & Error Handling

### ❌ Failure 1: Missing Authentication Token

```
Request reaches backend
  ↓
❌ LOG: 🔐 Auth check - Authorization header: missing
  ↓
Return: 401 Unauthorized
  ↓
Frontend receives 401
  ↓
❌ LOG: ❌ Failed to save changes: 401 Unauthorized
  ↓
Show error: "Authentication required - please login again"
```

### ❌ Failure 2: Invalid Token

```
Request reaches backend
  ↓
✅ LOG: 🔐 Token received, verifying with JWT_SECRET...
  ↓
❌ JWT.verify() fails (bad signature)
  ↓
❌ LOG: ❌ Token verification failed: invalid signature
  ↓
Return: 403 Forbidden
  ↓
Frontend receives 403
  ↓
Show error: "Invalid or expired token"
```

### ❌ Failure 3: Missing or Invalid Slot Numbers

```
Request reaches backend controller
  ↓
✅ LOG: 🔍 Received save request: {...}
  ↓
Validate slots array
  ↓
❌ Find slot with slotNumber = 9 (lunch break)
  ↓
❌ LOG: ❌ Slot is lunch break: 9
  ↓
❌ LOG: ❌ return { error: "Slot 9 is during lunch break..." }
  ↓
Return: 400 Bad Request
  ↓
Frontend receives 400
  ↓
❌ LOG: ❌ Failed to save changes: 400 Bad Request
  ↓
Show error: "Slot 9 is during lunch break (12 PM - 1 PM) and cannot be set"
```

### ❌ Failure 4: Database Connection Error

```
All validations pass
  ↓
Try to get database connection
  ↓
✅ LOG: 🔌 Getting database connection...
  ↓
❌ Connection pool error (MySQL down or invalid credentials)
  ↓
❌ LOG: ❌ Error in updateMultipleSlots: 
          Error: connect ECONNREFUSED 127.0.0.1:3306
  ↓
❌ LOG: 🔙 Transaction rolled back due to error
  ↓
Return: 500 Internal Server Error
  ↓
Frontend receives 500
  ↓
❌ LOG: ❌ Failed to save changes: 500 Internal Server Error
  ↓
Show error: "Server error - please try again later"
```

---

## Data Transformations

### Step 1: UI State
```javascript
localChanges = {
  1: true,   // Slot 1 toggled as available
  2: true,   // Slot 2 toggled as available
  3: true,   // Slot 3 toggled as available
  4: false,  // Slot 4 toggled as unavailable
  5: false   // Slot 5 toggled as unavailable
}
```

### Step 2: Available Slots Array (Frontend)
```javascript
availableSlots = [1, 2, 3]  // Only true values
```

### Step 3: Object Format (Frontend)
```javascript
slotsToSave = {
  1: true,
  2: true,
  3: true
}
```

### Step 4: Array Format (Service)
```javascript
slotsArray = [
  { slotNumber: 1, isAvailable: true },
  { slotNumber: 2, isAvailable: true },
  { slotNumber: 3, isAvailable: true }
]
```

### Step 5: HTTP Request Body
```json
{
  "scheduleDate": "2026-04-19",
  "slots": [
    { "slotNumber": 1, "isAvailable": true },
    { "slotNumber": 2, "isAvailable": true },
    { "slotNumber": 3, "isAvailable": true }
  ]
}
```

### Step 6: Validated & Formatted (Backend)
```javascript
formattedSlots = [
  { slotNumber: 1, isAvailable: true },
  { slotNumber: 2, isAvailable: true },
  { slotNumber: 3, isAvailable: true }
]
```

### Step 7: Database Rows
```sql
INSERT INTO appointment_slots VALUES
(NULL, 42, '2026-04-19', 1, '08:00:00', '08:30:00', 1, 0, NOW(), NOW()),
(NULL, 42, '2026-04-19', 2, '08:30:00', '09:00:00', 1, 0, NOW(), NOW()),
(NULL, 42, '2026-04-19', 3, '09:00:00', '09:30:00', 1, 0, NOW(), NOW())
```

---

## Slot Time Mapping

```
Slot # | Time Slot   | Start   | End     | Type
-------|-------------|---------|---------|----------
1      | 08:00-08:30 | 08:00   | 08:30   | Morning
2      | 08:30-09:00 | 08:30   | 09:00   | Morning
3      | 09:00-09:30 | 09:00   | 09:30   | Morning
4      | 09:30-10:00 | 09:30   | 10:00   | Morning
5      | 10:00-10:30 | 10:00   | 10:30   | Morning
6      | 10:30-11:00 | 10:30   | 11:00   | Morning
7      | 11:00-11:30 | 11:00   | 11:30   | Morning
8      | 11:30-12:00 | 11:30   | 12:00   | Morning
9      | 12:00-12:30 | 12:00   | 12:30   | LUNCH 🚫
10     | 12:30-13:00 | 12:30   | 13:00   | LUNCH 🚫
11     | 13:00-13:30 | 13:00   | 13:30   | Afternoon
...    | ...         | ...     | ...     | ...
24     | 20:30-21:00 | 20:30   | 21:00   | Evening
```

---

## Key Logging Points Summary

| Layer | Log ID | What It Shows |
|-------|--------|---------------|
| Frontend UI | 💾 | Button click detected |
| Frontend State | 📊 | Selected slots tracked |
| Frontend Service | 📤 | Data being sent to API |
| Network | (HTTP) | Request/response status |
| Backend Auth | 🔐 | Token verification |
| Backend Controller | 🔍 | Request data received |
| Backend Validation | ✅/❌ | Each validation step |
| Backend Model | 🔌 | Database operations |
| Database | (SQL) | Actual rows affected |

---

## Quick Reference: Expected Log Sequence (Success)

```
1. 💾 Save button clicked
2. 📊 Local changes shown
3. ✅ Currently available slots shown
4. 📤 Sending to API with data
5. 📤 scheduleService converting data
6. 📤 final request shown
   [API call happens here]
7. 🔐 Auth check
8. 🔐 Token verified
9. 🔍 Received save request
10. ✅ Formatted slots
11. 📅 Doctor updating schedule
12. 📋 Saving X slots
13. 🔌 Getting connection
14. 🔌 Connection acquired
15. 🔄 Transaction started
16. 🗑️ Delete query
17. 📤 Inserting each slot (repeat for each)
18. 💾 All inserts complete
19. 📝 Transaction committed
20. ✅ Schedule save successful
```

---

## Verification: Database State After Successful Save

```sql
-- Check that slots were saved
SELECT 
  slot_number,
  slot_start_time,
  slot_end_time,
  is_available,
  is_booked
FROM appointment_slots
WHERE doctor_id = 42 AND slot_date = '2026-04-19'
ORDER BY slot_number;

-- Expected output:
-- slot_number | slot_start_time | slot_end_time | is_available | is_booked
-- 1           | 08:00:00        | 08:30:00      | 1            | 0
-- 2           | 08:30:00        | 09:00:00      | 1            | 0
-- 3           | 09:00:00        | 09:30:00      | 1            | 0
```

This complete flow with enhanced logging will help identify exactly where any issues occur.
