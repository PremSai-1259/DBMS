# Testing Guide - Healthcare Platform Backend

## Quick Testing with cURL or Postman

### 1. Doctor Approval Workflow Test

#### Step 1: Doctor Signup
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Sarah Smith",
    "email": "sarah@hospital.com",
    "password": "password123",
    "role": "doctor"
  }'
```

Response:
```json
{
  "message": "Signup successful",
  "userId": 2,
  "token": "eyJhbGc...",
  "user": { "id": 2, "name": "Dr. Sarah Smith", "role": "doctor" }
}
```

Save the token: `TOKEN_DOCTOR=eyJhbGc...`

#### Step 2: Doctor Creates Profile
```bash
curl -X POST http://localhost:3000/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_DOCTOR" \
  -d '{
    "specialization": "Cardiology",
    "experience": 8,
    "hospitalName": "Heart Care Hospital",
    "address": "123 Medical Road, City"
  }'
```

#### Step 3: Doctor Uploads Certificate
```bash
curl -X POST http://localhost:3000/files/upload \
  -H "Authorization: Bearer $TOKEN_DOCTOR" \
  -F "file=@/path/to/certificate.pdf" \
  -F "fileType=certificate"
```

Response:
```json
{
  "message": "File uploaded successfully",
  "fileId": 5,
  "fileName": "certificate.pdf",
  "fileType": "certificate"
}
```

Save: `FILE_ID=5`

#### Step 4: Doctor Requests Approval
```bash
curl -X POST http://localhost:3000/doctor/request-approval \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_DOCTOR" \
  -d '{
    "certificateFileId": 5
  }'
```

#### Step 5: Admin Views Pending Requests
```bash
# First, signup as admin (or login if already exists)
# Get admin token, then:

curl -X GET http://localhost:3000/admin/pending-doctors \
  -H "Authorization: Bearer $TOKEN_ADMIN"
```

Response:
```json
{
  "pending": [
    {
      "id": 1,
      "doctor_id": 2,
      "status": "pending",
      "name": "Dr. Sarah Smith",
      "email": "sarah@hospital.com"
    }
  ],
  "count": 1
}
```

#### Step 6: Admin Approves Doctor
```bash
curl -X PUT http://localhost:3000/admin/approve/1 \
  -H "Authorization: Bearer $TOKEN_ADMIN"
```

✅ Doctor is now verified and can generate slots!

---

### 2. Appointment Booking Workflow Test

#### Step 1: Patient Signup
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Patient",
    "email": "john@patient.com",
    "password": "password123",
    "role": "patient"
  }'
```

Save token: `TOKEN_PATIENT=eyJhbGc...`

#### Step 2: Patient Creates Profile (MANDATORY)
```bash
curl -X POST http://localhost:3000/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_PATIENT" \
  -d '{
    "age": 35,
    "gender": "Male",
    "phone": "9876543210",
    "bloodGroup": "O+"
  }'
```

✅ Now patient can book!

#### Step 3: Doctor Generates Slots
```bash
curl -X POST http://localhost:3000/slots/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_DOCTOR" \
  -d '{
    "slotDate": "2024-12-25"
  }'
```

#### Step 4: Patient Views Available Slots
```bash
curl -X GET "http://localhost:3000/slots/available?doctorId=2&slotDate=2024-12-25"
```

Response:
```json
{
  "slotDate": "2024-12-25",
  "available": 24,
  "slots": [
    { "id": 1, "slotNumber": 1 },
    { "id": 2, "slotNumber": 2 },
    ...
  ]
}
```

Save a slot ID: `SLOT_ID=1`

#### Step 5: Patient Books Appointment
```bash
curl -X POST http://localhost:3000/appointments/book \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_PATIENT" \
  -d '{
    "doctorId": 2,
    "slotId": 1
  }'
```

Response:
```json
{
  "message": "Appointment booked successfully",
  "appointmentId": 10,
  "slotNumber": 1,
  "slotDate": "2024-12-25"
}
```

✅ Appointment booked!

#### Step 6: Patient Views Appointments
```bash
curl -X GET http://localhost:3000/appointments \
  -H "Authorization: Bearer $TOKEN_PATIENT"
```

---

### 3. Medical Record Access Test

#### Step 1: Patient Uploads Medical Report
```bash
curl -X POST http://localhost:3000/files/upload \
  -H "Authorization: Bearer $TOKEN_PATIENT" \
  -F "file=@/path/to/report.pdf" \
  -F "fileType=medical_report"
```

Save: `REPORT_ID=8`

#### Step 2: Doctor Requests Access
```bash
curl -X POST http://localhost:3000/access/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_DOCTOR" \
  -d '{
    "patientId": 1,
    "fileId": 8
  }'
```

#### Step 3: Patient Views Access Requests
```bash
curl -X GET http://localhost:3000/access/requests \
  -H "Authorization: Bearer $TOKEN_PATIENT"
```

#### Step 4: Patient Approves Access
```bash
curl -X PUT http://localhost:3000/access/respond/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_PATIENT" \
  -d '{
    "status": "approved",
    "expiresAt": "2024-12-31 23:59:59"
  }'
```

#### Step 5: Doctor Downloads File
```bash
curl -X GET http://localhost:3000/files/8 \
  -H "Authorization: Bearer $TOKEN_DOCTOR" \
  -o report.pdf
```

✅ File downloaded!

#### Step 6: Patient Revokes Access
```bash
curl -X PUT http://localhost:3000/access/revoke/1 \
  -H "Authorization: Bearer $TOKEN_PATIENT"
```

Doctor can no longer access the file.

---

### 4. Consultation & Review Test

#### Step 1: Complete Appointment (Manual - Admin marks as complete)
```sql
UPDATE appointments SET status = 'completed' WHERE id = 10;
```

#### Step 2: Doctor Writes Consultation Notes
```bash
curl -X POST http://localhost:3000/consultation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_DOCTOR" \
  -d '{
    "appointmentId": 10,
    "reasonForVisit": "Regular checkup",
    "diagnosis": "Healthy",
    "prescription": "None required",
    "additionalNotes": "Keep up with exercise"
  }'
```

#### Step 3: Patient Leaves Review
```bash
curl -X POST http://localhost:3000/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_PATIENT" \
  -d '{
    "appointmentId": 10,
    "rating": 5,
    "comment": "Excellent doctor, very professional"
  }'
```

#### Step 4: View Doctor Reviews
```bash
curl -X GET http://localhost:3000/reviews/2
```

Response:
```json
{
  "stats": {
    "totalReviews": 1,
    "averageRating": "5.00"
  },
  "reviews": [...]
}
```

---

### 5. Notification Test

#### Get All Notifications
```bash
curl -X GET http://localhost:3000/notifications \
  -H "Authorization: Bearer $TOKEN_PATIENT"
```

Response:
```json
{
  "total": 3,
  "unread": 1,
  "notifications": [
    {
      "id": 1,
      "type": "appointment_booked",
      "message": "Your appointment has been confirmed",
      "isRead": false,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Mark as Read
```bash
curl -X PUT http://localhost:3000/notifications/1/read \
  -H "Authorization: Bearer $TOKEN_PATIENT"
```

---

## Error Scenarios to Test

### ❌ Patient Cannot Book Without Profile
```bash
# Signup as patient, then immediately try to book
curl -X POST http://localhost:3000/appointments/book \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_NEW_PATIENT" \
  -d '{ "doctorId": 2, "slotId": 1 }'

# Response:
# "Patient profile must be created first"
```

### ❌ Unverified Doctor Cannot Generate Slots
```bash
# Doctor signup, create profile, but don't get approved yet
curl -X POST http://localhost:3000/slots/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_UNVERIFIED_DOCTOR" \
  -d '{ "slotDate": "2024-12-25" }'

# Response:
# "Doctor profile must be verified before generating slots"
```

### ❌ Doctor Cannot Access File Without Approval
```bash
curl -X GET http://localhost:3000/files/8 \
  -H "Authorization: Bearer $TOKEN_DOCTOR"

# Response (if access not approved):
# "Access denied to this file"
```

### ❌ Cannot Review Incomplete Appointment
```bash
# Try to review appointment with status != 'completed'
curl -X POST http://localhost:3000/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_PATIENT" \
  -d '{ "appointmentId": 10, "rating": 5, "comment": "..." }'

# Response:
# "Can only review completed appointments"
```

---

## Postman Collection Template

```json
{
  "info": { "name": "Healthcare API", "version": "1.0" },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Signup Doctor",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/auth/signup",
            "body": {
              "mode": "raw",
              "raw": "{\"name\":\"Dr. Sarah\",\"email\":\"sarah@hospital.com\",\"password\":\"pass123\",\"role\":\"doctor\"}"
            }
          }
        }
      ]
    }
  ]
}
```

---

## Testing Checklist

- [ ] **Doctor Workflow**: Signup → Profile → Certificate → Request Approval → Admin Approval
- [ ] **Patient Workflow**: Signup → Profile → View Slots → Book Appointment
- [ ] **File Upload**: Upload certificate, medical report, profile image
- [ ] **Access Control**: Request → Approve → Download → Revoke
- [ ] **Slot Management**: Generate 24 slots, verify uniqueness
- [ ] **Appointments**: Book, cancel, get details
- [ ] **Consultation**: Write notes, view notes
- [ ] **Reviews**: Create review, update review, view stats
- [ ] **Notifications**: Create, read, mark as read
- [ ] **Error Cases**: Missing profile, unverified doctor, unauthorized access
- [ ] **Email Notifications**: Check console output (or email if configured)

---

## Database Inspection

```sql
-- Check all users
SELECT id, name, role, email FROM users;

-- Check doctor profiles
SELECT dp.*, u.name, u.email FROM doctor_profiles dp 
JOIN users u ON dp.user_id = u.id;

-- Check appointments
SELECT a.*, u.name as patient_name FROM appointments a 
JOIN users u ON a.patient_id = u.id;

-- Check notifications
SELECT * FROM notifications WHERE user_id = 1 ORDER BY created_at DESC;

-- Check file access
SELECT ra.*, f.file_name FROM record_access ra 
JOIN files f ON ra.file_id = f.id;
```

---

## Performance Notes

- Generated slots are created with `UNIQUE` constraint
- Duplicate booking attempts are prevented
- File hash stored for integrity verification
- Access expiration checked on every file access
- Notification queries optimized with indexing

---

## API Response Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | GET /profile |
| 201 | Created | POST /appointments/book |
| 400 | Bad request | Missing required fields |
| 401 | Unauthorized | No token provided |
| 403 | Forbidden | Doctor not verified |
| 404 | Not found | Appointment ID doesn't exist |
| 409 | Conflict | Duplicate approval request |
| 500 | Server error | Database connection failed |
