use healthcare_db;

-- Check doctor_approvals table structure
DESCRIBE doctor_approvals;

-- Try the query
SELECT 
  da.id,
  da.doctor_id,
  da.certificate_file_id,
  da.status,
  da.admin_message,
  da.submitted_at,
  da.reviewed_at,
  u.name,
  u.email,
  f.file_path,
  f.file_name,
  dp.specialization,
  dp.experience,
  dp.hospital_name,
  dp.address,
  dp.is_verified
FROM doctor_approvals da
JOIN users u ON da.doctor_id = u.id
LEFT JOIN files f ON da.certificate_file_id = f.id
LEFT JOIN doctor_profiles dp ON da.doctor_id = dp.user_id
WHERE da.status = 'pending'
ORDER BY da.id DESC;
