# Schedule Save Process - Complete Details

## Overview
When a doctor saves their schedule changes, all slot availability is stored in the `appointment_slots` table with complete details for tracking and booking.

## Database Schema (appointment_slots)

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key, auto-increment |
| doctor_id | INT | Foreign key to users table |
| slot_date | DATE | Date for which slot is available (YYYY-MM-DD) |
| slot_number | INT | Slot number (1-8, 11-24, skipping 9-10 lunch break) |
| slot_start_time | TIME | Slot start time (HH:MM:SS) |
| slot_end_time | TIME | Slot end time (HH:MM:SS) |
| is_available | BOOLEAN | Availability status (TRUE/FALSE) |
| is_booked | BOOLEAN | Booking status (TRUE/FALSE) |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

## Save Flow

### 1. Frontend (ScheduleManager.jsx)

```
Doctor selects/deselects slots
    ↓
Clicks "Save Changes"
    ↓
handleSaveChanges() validates:
  - At least one slot is available
  - Changes exist to save
    ↓
Calls scheduleService.updateMultipleSlots()
    ↓
Sends POST request to /api/schedule/bulk
  Body: {
    scheduleDate: "2026-04-19",
    slots: [
      { slotNumber: 1, isAvailable: true },
      { slotNumber: 2, isAvailable: true },
      { slotNumber: 3, isAvailable: false },
      ...
    ]
  }
```

### 2. Backend Controller (scheduleController.js)

```
POST /api/schedule/bulk receives request
    ↓
Validates:
  - scheduleDate is provided
  - slots array is valid
  - Slot numbers are valid (1-8, 11-24)
  - At least one slot is available
    ↓
Logs: "Doctor X updating schedule for 2026-04-19"
    ↓
Calls AppointmentSlot.updateMultipleSlots()
```

### 3. Model (AppointmentSlot.js)

**updateMultipleSlots() Process:**

```
1. Filter only available slots from request
2. Get slot time information (08:00-20:00)
3. Start database transaction
4. Delete ALL existing slots for that doctor/date
5. For each available slot:
   - Insert record with:
     * doctor_id
     * slot_date
     * slot_number
     * slot_start_time (from generateSlotTimes)
     * slot_end_time (from generateSlotTimes)
     * is_available = TRUE
     * is_booked = FALSE
   - Log: "✅ Slot 1 (08:00-08:30) saved for 2026-04-19"
6. Commit transaction
7. Log: "📝 Saved X available slots for doctor Y on 2026-04-19"
8. Return success
```

## Sample Stored Data

```sql
-- When doctor saves slots 1, 2, 3, 5, 7 as available for 2026-04-19:

INSERT INTO appointment_slots VALUES
  (NULL, 42, '2026-04-19', 1, '08:00', '08:30', TRUE, FALSE, NOW(), NOW()),
  (NULL, 42, '2026-04-19', 2, '08:30', '09:00', TRUE, FALSE, NOW(), NOW()),
  (NULL, 42, '2026-04-19', 3, '09:00', '09:30', TRUE, FALSE, NOW(), NOW()),
  (NULL, 42, '2026-04-19', 5, '10:00', '10:30', TRUE, FALSE, NOW(), NOW()),
  (NULL, 42, '2026-04-19', 7, '11:00', '11:30', TRUE, FALSE, NOW(), NOW());
```

## Frontend Success Feedback

After successful save, user sees:
```
✓ Schedule saved! 5 slot(s) available: 1 (08:00 - 08:30), 2 (08:30 - 09:00), 3 (09:00 - 09:30), 5 (10:00 - 10:30), 7 (11:00 - 11:30)
```

## Slot Time Reference

### Morning (8 AM - 12 PM)
- Slot 1: 08:00 - 08:30
- Slot 2: 08:30 - 09:00
- Slot 3: 09:00 - 09:30
- Slot 4: 09:30 - 10:00
- Slot 5: 10:00 - 10:30
- Slot 6: 10:30 - 11:00
- Slot 7: 11:00 - 11:30
- Slot 8: 11:30 - 12:00

### Lunch Break (12 PM - 1 PM)
- Slots 9-10: UNAVAILABLE (NOT STORED)

### Afternoon/Evening (1 PM - 9 PM)
- Slot 11: 13:00 - 13:30
- Slot 12: 13:30 - 14:00
- Slot 13: 14:00 - 14:30
- Slot 14: 14:30 - 15:00
- Slot 15: 15:00 - 15:30
- Slot 16: 15:30 - 16:00
- Slot 17: 16:00 - 16:30
- Slot 18: 16:30 - 17:00
- Slot 19: 17:00 - 17:30
- Slot 20: 17:30 - 18:00
- Slot 21: 18:00 - 18:30
- Slot 22: 18:30 - 19:00
- Slot 23: 19:00 - 19:30
- Slot 24: 19:30 - 20:00

## Key Features

✅ **Complete Data Storage**: All 22 valid slots (skipping lunch break) store time details
✅ **Transaction Safety**: All-or-nothing update (if one slot fails, all are rolled back)
✅ **Automatic Timestamps**: created_at and updated_at tracked automatically
✅ **Availability Tracking**: is_available and is_booked status maintained
✅ **Date Isolation**: Each doctor can set different availability for each date
✅ **Detailed Logging**: Console shows exactly what was saved and when
✅ **Error Handling**: Connection errors gracefully handled with rollback

## Database Indexes

```sql
-- UNIQUE (doctor_id, slot_date, slot_number)
-- Ensures no duplicate slot entries for same doctor/date

-- INDEX idx_doctor_date (doctor_id, slot_date)
-- Fast lookup of all slots for doctor on specific date

-- INDEX idx_doctor_available (doctor_id, is_available)
-- Fast lookup of available slots for a doctor
```

## Verification Query

To check saved slots for a doctor on a specific date:
```sql
SELECT 
  slot_number,
  slot_start_time,
  slot_end_time,
  is_available,
  is_booked,
  updated_at
FROM appointment_slots
WHERE doctor_id = 42 AND slot_date = '2026-04-19'
ORDER BY slot_number;
```

## Error Handling

| Error | Cause | Resolution |
|-------|-------|-----------|
| Invalid slot number | User submitted slot 0, 9, 10, 25, etc. | Frontend validation prevents this |
| No available slot | User tried to save with no slots selected | Frontend validation shows warning |
| Database connection failed | Server/DB issue | Frontend shows fallback UI with retry |
| Transaction failed | One insert failed | All updates rolled back, user sees error |

---

**Last Updated**: 2026-04-19  
**Version**: 2.0 (Enhanced with slot time storage)
