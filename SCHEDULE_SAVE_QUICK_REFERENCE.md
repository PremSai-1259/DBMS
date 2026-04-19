# Quick Reference: Schedule Save Data Storage

## When Doctor Saves Schedule Changes

### Data Stored in `appointment_slots` Table

```
✅ SAVED DATA PER SLOT:
├── doctor_id          → Who is setting the schedule (from JWT token)
├── slot_date          → Which date (YYYY-MM-DD format)
├── slot_number        → Which slot (1-8, 11-24, skipping 9-10 lunch)
├── slot_start_time    → When slot starts (HH:MM:SS, e.g., 08:00:00)
├── slot_end_time      → When slot ends (HH:MM:SS, e.g., 08:30:00)
├── is_available       → TRUE (doctor set it as available)
├── is_booked          → FALSE (no patient booking yet)
├── created_at         → When record was created (auto-timestamp)
└── updated_at         → When record was last updated (auto-timestamp)
```

## Example: Save 5 Slots

**User Action:** Doctor selects slots 1, 2, 3, 5, 7 on 2026-04-19 and clicks "Save Changes"

**Database After Save:**
```
┌─────┬───────────────┬─────────────┬──────────────┬──────────────┬──────────────┬──────────┬──────────┐
│ id  │ doctor_id     │ slot_date   │ slot_number  │ slot_start   │ slot_end     │ available│ booked   │
├─────┼───────────────┼─────────────┼──────────────┼──────────────┼──────────────┼──────────┼──────────┤
│ 101 │ 42            │ 2026-04-19  │ 1            │ 08:00:00     │ 08:30:00     │ TRUE     │ FALSE    │
│ 102 │ 42            │ 2026-04-19  │ 2            │ 08:30:00     │ 09:00:00     │ TRUE     │ FALSE    │
│ 103 │ 42            │ 2026-04-19  │ 3            │ 09:00:00     │ 09:30:00     │ TRUE     │ FALSE    │
│ 104 │ 42            │ 2026-04-19  │ 5            │ 10:00:00     │ 10:30:00     │ TRUE     │ FALSE    │
│ 105 │ 42            │ 2026-04-19  │ 7            │ 11:00:00     │ 11:30:00     │ TRUE     │ FALSE    │
└─────┴───────────────┴─────────────┴──────────────┴──────────────┴──────────────┴──────────┴──────────┘
```

## Frontend User Sees

```
✓ Schedule saved! 5 slot(s) available: 
  1 (08:00 - 08:30), 
  2 (08:30 - 09:00), 
  3 (09:00 - 09:30), 
  5 (10:00 - 10:30), 
  7 (11:00 - 11:30)
```

## Console Logging (Backend)

```
📅 [2026-04-19T12:30:45.123Z] Doctor 42 updating schedule for 2026-04-19
📋 Saving 5 available slots
🗑️ Deleted existing slots for doctor 42 on 2026-04-19
✅ Slot 1 (08:00-08:30) saved for 2026-04-19
✅ Slot 2 (08:30-09:00) saved for 2026-04-19
✅ Slot 3 (09:00-09:30) saved for 2026-04-19
✅ Slot 5 (10:00-10:30) saved for 2026-04-19
✅ Slot 7 (11:00-11:30) saved for 2026-04-19
📝 Saved 5 available slots for doctor 42 on 2026-04-19
```

## API Response

```json
{
  "success": true,
  "message": "Schedule saved successfully!",
  "scheduleDate": "2026-04-19",
  "totalSlotsUpdated": 5,
  "slotsAvailable": [1, 2, 3, 5, 7],
  "timestamp": "2026-04-19T12:30:45.000Z"
}
```

## Key Points

✅ **Only Available Slots Stored** → Unavailable slots are deleted, not stored
✅ **Time Auto-Calculated** → Backend knows times for each slot number
✅ **Transaction Safe** → All 5 slots save together or all fail together
✅ **Date-Specific** → Doctor can have different availability for each date
✅ **Unique Per Doctor** → Multiple doctors can set different schedules for same date
✅ **Timestamps Auto-Tracked** → created_at and updated_at set automatically

## SQL Query to Verify Saved Data

```sql
-- Check all available slots for doctor 42 on 2026-04-19
SELECT 
  slot_number,
  TIME_FORMAT(slot_start_time, '%H:%i') as start,
  TIME_FORMAT(slot_end_time, '%H:%i') as end,
  is_available,
  is_booked,
  DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') as last_updated
FROM appointment_slots
WHERE doctor_id = 42 
  AND slot_date = '2026-04-19'
  AND is_available = TRUE
ORDER BY slot_number;
```

## Database Constraints

```sql
-- Prevents duplicate entries for same slot/doctor/date
UNIQUE (doctor_id, slot_date, slot_number)

-- Fast lookups by doctor and date
INDEX idx_doctor_date (doctor_id, slot_date)

-- Fast lookups for available slots
INDEX idx_doctor_available (doctor_id, is_available)
```

## Error Scenarios Handled

| Scenario | What Happens |
|----------|-------------|
| Invalid slot number (9, 10) | Rejected before saving, frontend validation |
| No slots selected | Shows warning, prevents save |
| Database connection down | Falls back to local UI, saves when reconnected |
| Server error during save | Shows error message, keeps local changes |
| One slot insert fails | All slots rolled back, error message shown |

---

**TL;DR:** When doctor saves schedule, all selected slots (1-8, 11-24) are stored with their exact times, doctor ID, date, and availability status. Unselected slots are deleted. All or nothing transaction.
