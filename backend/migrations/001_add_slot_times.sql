-- Migration: Add slot_start_time and slot_end_time to appointment_slots table
-- Date: 2026-04-19
-- Description: Store complete slot time details for better data tracking

ALTER TABLE appointment_slots 
ADD COLUMN slot_start_time TIME AFTER slot_number,
ADD COLUMN slot_end_time TIME AFTER slot_start_time;

-- Add index for better query performance on available slots
ALTER TABLE appointment_slots 
ADD INDEX idx_doctor_available (doctor_id, is_available);

-- Update existing records with time values based on slot number
-- Morning slots (1-8): 08:00 - 12:00
UPDATE appointment_slots SET slot_start_time = '08:00', slot_end_time = '08:30' WHERE slot_number = 1;
UPDATE appointment_slots SET slot_start_time = '08:30', slot_end_time = '09:00' WHERE slot_number = 2;
UPDATE appointment_slots SET slot_start_time = '09:00', slot_end_time = '09:30' WHERE slot_number = 3;
UPDATE appointment_slots SET slot_start_time = '09:30', slot_end_time = '10:00' WHERE slot_number = 4;
UPDATE appointment_slots SET slot_start_time = '10:00', slot_end_time = '10:30' WHERE slot_number = 5;
UPDATE appointment_slots SET slot_start_time = '10:30', slot_end_time = '11:00' WHERE slot_number = 6;
UPDATE appointment_slots SET slot_start_time = '11:00', slot_end_time = '11:30' WHERE slot_number = 7;
UPDATE appointment_slots SET slot_start_time = '11:30', slot_end_time = '12:00' WHERE slot_number = 8;

-- Afternoon/Evening slots (11-24): 13:00 - 20:00
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

-- Verify changes
SELECT COUNT(*) as total_slots, 
       SUM(CASE WHEN slot_start_time IS NOT NULL THEN 1 ELSE 0 END) as slots_with_times
FROM appointment_slots;

