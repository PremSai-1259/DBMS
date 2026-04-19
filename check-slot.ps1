# Simple test to check if slot 39 exists with all required fields
$query = @"
SELECT 
  id,
  doctor_id,
  slot_date,
  slot_number,
  slot_start_time,
  slot_end_time,
  is_available,
  is_booked,
  is_active
FROM appointment_slots 
WHERE id = 39;
"@

Write-Host "Checking if slot 39 exists in database..."
Write-Host "Query: $query"
