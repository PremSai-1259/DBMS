SELECT 
  ra.id,
  ra.doctor_id,
  ra.patient_id,
  ra.file_id,
  ra.status,
  u_doctor.name as doctor_name,
  u_patient.name as patient_name,
  f.file_name,
  ra.requested_at,
  ra.updated_at
FROM record_access ra
JOIN users u_doctor ON ra.doctor_id = u_doctor.id
JOIN users u_patient ON ra.patient_id = u_patient.id
JOIN files f ON ra.file_id = f.id
ORDER BY ra.id DESC
LIMIT 10;
