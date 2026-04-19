# Doctor Schedule Management Feature

## Overview
This feature allows doctors to manage their daily availability by setting individual appointment slots as available or unavailable. The system provides **24 slots per day** from **8:00 AM to 9:00 PM** with a **1-hour lunch break from 12:00 PM to 1:00 PM**.

## Features

### Slot Configuration
- **Total Slots**: 24 per day
- **Duration**: 30 minutes per slot
- **Operating Hours**: 8:00 AM - 9:00 PM
- **Break**: 12:00 PM - 1:00 PM (Lunch break - no slots)
- **Slot Mapping**:
  - Morning: Slots 1-8 (8:00 AM - 12:00 PM)
  - Afternoon: Slots 11-24 (1:00 PM - 9:00 PM)
  - Slots 9-10 are reserved for lunch break

### Default Behavior
- All slots are **unavailable by default**
- Doctors must explicitly mark slots as available
- Changes are saved immediately to the database

## Database Schema

### doctor_schedules Table
```sql
CREATE TABLE doctor_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    schedule_date DATE NOT NULL,
    
    slot_1 BOOLEAN DEFAULT FALSE,
    slot_2 BOOLEAN DEFAULT FALSE,
    -- ... (slots 3-8)
    slot_11 BOOLEAN DEFAULT FALSE,
    -- ... (slots 12-24)
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE (doctor_id, schedule_date),
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## API Endpoints

### 1. Get Slot Time Information
**GET** `/api/schedule/slot-times`
- Returns all 24 slots with their times
- Useful for frontend rendering
- No authentication required

**Response:**
```json
{
  "success": true,
  "totalSlots": 24,
  "slots": [
    { "slot": 1, "start": "08:00", "end": "08:30" },
    { "slot": 2, "start": "08:30", "end": "09:00" },
    ...
  ],
  "info": {
    "morning": "8:00 AM - 12:00 PM (slots 1-8)",
    "breakTime": "12:00 PM - 1:00 PM (no slots 9-10)",
    "afternoon": "1:00 PM - 9:00 PM (slots 11-24)",
    "slotDuration": "30 minutes each"
  }
}
```

### 2. Get Slots for a Specific Date
**GET** `/api/schedule/date`
- Returns all 24 slots for a given date with availability status
- Creates schedule entry if it doesn't exist
- **Authentication**: Required (Doctor)

**Query Parameters:**
- `scheduleDate` (required): Date in YYYY-MM-DD format

**Response:**
```json
{
  "success": true,
  "scheduleDate": "2026-04-20",
  "totalSlots": 24,
  "slots": [
    {
      "slotNumber": 1,
      "startTime": "08:00",
      "endTime": "08:30",
      "displayTime": "08:00 - 08:30",
      "isAvailable": false
    },
    ...
  ]
}
```

### 3. Update Single Slot Availability
**POST** `/api/schedule/slot`
- Updates availability for a single slot
- **Authentication**: Required (Doctor)

**Request Body:**
```json
{
  "scheduleDate": "2026-04-20",
  "slotNumber": 1,
  "isAvailable": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Slot 1 updated to available",
  "slotNumber": 1,
  "isAvailable": true
}
```

### 4. Update Multiple Slots (Bulk)
**POST** `/api/schedule/bulk`
- Updates multiple slots in a single request
- More efficient for bulk changes
- **Authentication**: Required (Doctor)

**Request Body:**
```json
{
  "scheduleDate": "2026-04-20",
  "slots": {
    "1": true,
    "2": true,
    "3": false,
    "4": true,
    "5": true,
    "6": true,
    "7": true,
    "8": true,
    "11": true,
    "12": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "10 slot(s) updated",
  "updatedCount": 10
}
```

### 5. Get Week Schedule
**GET** `/api/schedule/week`
- Returns schedule for 7 consecutive days starting from a given date
- **Authentication**: Required (Doctor)

**Query Parameters:**
- `startDate` (required): Date in YYYY-MM-DD format

**Response:**
```json
{
  "success": true,
  "weekSchedule": {
    "2026-04-20": [
      { "slotNumber": 1, "displayTime": "08:00 - 08:30", "isAvailable": true },
      ...
    ],
    "2026-04-21": [...]
  },
  "dayCount": 7
}
```

### 6. Get Schedule for Date Range
**GET** `/api/schedule/range`
- Returns raw schedule data for a date range
- **Authentication**: Required (Doctor)

**Query Parameters:**
- `startDate` (required): Date in YYYY-MM-DD format
- `endDate` (required): Date in YYYY-MM-DD format

## Frontend Components

### ScheduleManager Component
Located in: `/frontend/src/components/ScheduleManager.jsx`

**Features:**
- Displays all 24 slots organized by morning/afternoon
- Toggle slots between available/unavailable
- Bulk actions (Select All / Deselect All)
- Real-time validation
- Save changes with confirmation
- Visual feedback with color coding

**Props:**
- `selectedDate` (string): Date in YYYY-MM-DD format

**Usage:**
```jsx
import ScheduleManager from '../components/ScheduleManager'

<ScheduleManager selectedDate="2026-04-20" />
```

## Frontend Service

### scheduleService
Located in: `/frontend/src/services/scheduleService.js`

**Methods:**
- `getSlotsForDate(scheduleDate)` - Get slots for a date
- `updateSlotAvailability(scheduleDate, slotNumber, isAvailable)` - Update single slot
- `updateMultipleSlots(scheduleDate, slots)` - Update multiple slots
- `getWeekSchedule(startDate)` - Get week schedule
- `getScheduleRange(startDate, endDate)` - Get date range schedule
- `getSlotTimes()` - Get slot time information

## Usage Workflow

1. **Doctor logs in** and navigates to Schedule tab
2. **Selects a date** from the weekly date picker
3. **Views all 24 slots** organized by morning and afternoon
4. **Toggles slots** to mark them as available (green) or unavailable (gray)
5. **Makes bulk changes** using Select All / Deselect All buttons
6. **Saves changes** which are persisted to the database
7. **Changes reflect** immediately in the system

## Validation & Error Handling

- Invalid slot numbers (9, 10, <1, >24) are rejected
- Duplicate schedule entries are handled gracefully
- Failed updates trigger error toast notifications
- Unsaved changes can be canceled to revert
- Database queries include proper error logging

## Color Coding

- **Green** (#e6f9f2): Slot is available
- **Gray** (#f8f9fc): Slot is unavailable
- **Blue** (#e8f0fb): Selected date/active state
- **Yellow** (#fff8e6): Lunch break info

## Security

- All schedule endpoints require doctor authentication
- Only doctors can modify their own schedules
- Admin can access any doctor's schedule (future enhancement)

## Future Enhancements

1. Recurring schedules (weekly patterns)
2. Template schedules (copy from previous week)
3. Vacation/blocked dates
4. Admin override capabilities
5. Patient-facing availability display
6. Analytics on available slots
7. Integration with appointment booking system

## Testing

### Manual Testing Steps

1. **Create schedule entry:**
   ```bash
   GET /api/schedule/date?scheduleDate=2026-04-20
   ```

2. **Update single slot:**
   ```bash
   POST /api/schedule/slot
   Body: {"scheduleDate": "2026-04-20", "slotNumber": 1, "isAvailable": true}
   ```

3. **Verify database:**
   ```sql
   SELECT * FROM doctor_schedules WHERE doctor_id = 1 AND schedule_date = '2026-04-20';
   ```

## Implementation Notes

- Slots 9 and 10 are reserved and never displayed (lunch break)
- Schedule entries are created on-demand when first accessed
- All timestamps are stored in UTC
- Time display uses 24-hour format internally, 12-hour for UI
- Database cleanup is automatic via cascade delete on user deletion
