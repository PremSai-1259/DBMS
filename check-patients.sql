-- Check patient users
SELECT u.id, u.name, u.email, u.role, pp.id as profile_id
FROM users u
LEFT JOIN patient_profiles pp ON u.id = pp.user_id
WHERE u.role = 'patient'
LIMIT 10;
