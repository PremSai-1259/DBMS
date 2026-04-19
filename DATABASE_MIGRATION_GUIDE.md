# Database Migration Setup Guide

## For Existing Databases

If you already have the hospital management system running with data in `appointment_slots`, follow these steps to add the new slot time fields.

### Option 1: Run Migration Script (Recommended)

#### Step 1: Navigate to Backend
```powershell
cd backend
```

#### Step 2: Apply Migration
```bash
mysql -h localhost -u root -p hospital_management < migrations/001_add_slot_times.sql
```

When prompted, enter your MySQL password.

#### Step 3: Verify Migration
```bash
mysql -h localhost -u root -p hospital_management
```

Then run this query:
```sql
DESCRIBE appointment_slots;
```

You should see `slot_start_time` and `slot_end_time` columns listed.

### Option 2: Manual SQL (If script doesn't work)

#### Step 1: Login to MySQL
```powershell
mysql -u root -p
```

#### Step 2: Select Database
```sql
USE hospital_management;
```

#### Step 3: Add New Columns
```sql
ALTER TABLE appointment_slots 
ADD COLUMN slot_start_time TIME AFTER slot_number,
ADD COLUMN slot_end_time TIME AFTER slot_start_time;
```

#### Step 4: Add Performance Index
```sql
ALTER TABLE appointment_slots 
ADD INDEX idx_doctor_available (doctor_id, is_available);
```

#### Step 5: Update Existing Records (Morning Slots 1-8)
```sql
UPDATE appointment_slots SET slot_start_time = '08:00', slot_end_time = '08:30' WHERE slot_number = 1;
UPDATE appointment_slots SET slot_start_time = '08:30', slot_end_time = '09:00' WHERE slot_number = 2;
UPDATE appointment_slots SET slot_start_time = '09:00', slot_end_time = '09:30' WHERE slot_number = 3;
UPDATE appointment_slots SET slot_start_time = '09:30', slot_end_time = '10:00' WHERE slot_number = 4;
UPDATE appointment_slots SET slot_start_time = '10:00', slot_end_time = '10:30' WHERE slot_number = 5;
UPDATE appointment_slots SET slot_start_time = '10:30', slot_end_time = '11:00' WHERE slot_number = 6;
UPDATE appointment_slots SET slot_start_time = '11:00', slot_end_time = '11:30' WHERE slot_number = 7;
UPDATE appointment_slots SET slot_start_time = '11:30', slot_end_time = '12:00' WHERE slot_number = 8;
```

#### Step 6: Update Existing Records (Afternoon Slots 11-24)
```sql
UPDATE appointment_slots SET slot_start_time = '13:00', slot_end_time = '13:30' WHERE slot_number = 11;
UPDATE appointment_slots SET slot_start_time = '13:30', slot_end_time = '14:00' WHERE slot_number = 12;
UPDATE appointment_slots SET slot_start_time = '14:00', slot_end_time = '14:30' WHERE slot_number = 13;
UPDATE appointment_slots SET slot_start_time = '14:30', slot_end_time = '15:00' WHERE slot_number = 14;
UPDATE appointment_slots SET slot_start_time = '15:00', slot_end_time = '15:30' WHERE slot_number = 15;
UPDATE appointment_slots SET slot_start_time = '15:30', slot_end_time = '16:00' WHERE slot_number = 16;
UPDATE appointment_slots SET slot_start_time = '16:00', slot_end_time = '16:30' WHERE slot_number = 17;
UPDATE appointment_slots SET slot_start_time = '16:30', slot_end_time = '17:00' WHERE slot_number = 18;
UPDATE appointment_slots SET slot_start_time = '17:00', slot_end_time = '17:30' WHERE slot_number = 19;
UPDATE appointment_slots SET slot_start_time = '17:30', slot_end_time = '18:00' WHERE slot_number = 20;
UPDATE appointment_slots SET slot_start_time = '18:00', slot_end_time = '18:30' WHERE slot_number = 21;
UPDATE appointment_slots SET slot_start_time = '18:30', slot_end_time = '19:00' WHERE slot_number = 22;
UPDATE appointment_slots SET slot_start_time = '19:00', slot_end_time = '19:30' WHERE slot_number = 23;
UPDATE appointment_slots SET slot_start_time = '19:30', slot_end_time = '20:00' WHERE slot_number = 24;
```

#### Step 7: Verify Update
```sql
SELECT COUNT(*) as total_slots, 
       SUM(CASE WHEN slot_start_time IS NOT NULL THEN 1 ELSE 0 END) as slots_with_times
FROM appointment_slots;
```

Expected output: Should show same numbers in both columns.

#### Step 8: Check Sample Records
```sql
SELECT slot_number, slot_start_time, slot_end_time 
FROM appointment_slots 
LIMIT 10;
```

### Option 3: For New Fresh Installation

If you're setting up the database from scratch, just run:
```powershell
mysql -u root -p < backend/configs/schema.sql
```

The new columns will be included automatically.

## Verification Checklist

After migration, verify:

- [ ] No errors during migration execution
- [ ] `slot_start_time` column exists
- [ ] `slot_end_time` column exists
- [ ] `idx_doctor_available` index created
- [ ] Existing slots have time values populated
- [ ] New slots save with time values

### Test Query
```sql
SELECT * FROM appointment_slots WHERE is_available = TRUE LIMIT 1;
```

Should show all columns including `slot_start_time` and `slot_end_time` with TIME values like `08:00:00`.

## Rollback (If Needed)

If something goes wrong, you can rollback:

```sql
ALTER TABLE appointment_slots 
DROP COLUMN slot_start_time,
DROP COLUMN slot_end_time;

ALTER TABLE appointment_slots 
DROP INDEX idx_doctor_available;
```

## Troubleshooting

### Error: "Access denied for user"
**Solution:** Check your MySQL username and password

### Error: "Unknown database"
**Solution:** Make sure database name is correct (`hospital_management`)

### Error: "Duplicate column name"
**Solution:** Columns already exist, migration was successful

### Queries running slowly after migration
**Solution:** The new index should help. Try:
```sql
OPTIMIZE TABLE appointment_slots;
ANALYZE TABLE appointment_slots;
```

## What Changed

| What | Before | After |
|------|--------|-------|
| Columns | doctor_id, slot_date, slot_number, is_available, is_booked | + slot_start_time, slot_end_time |
| Data stored | Just slot number | Full time range (08:00-20:00) |
| Query speed | Slower for available slots | Faster with new index |
| Record size | ~60 bytes | ~70 bytes (minimal impact) |

## Next Steps

1. Apply the migration using one of the methods above
2. Restart the backend server: `npm start`
3. Test the Schedule feature in Doctor Portal
4. Verify slots save with times in database

---

**Migration Status:** ✅ Ready to apply  
**Estimated Time:** < 1 minute  
**Downtime Required:** None (backward compatible)  
**Data Loss:** None (only additions)
