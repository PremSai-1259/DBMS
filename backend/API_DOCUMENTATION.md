# Healthcare Platform Backend - Complete API Documentation

## Setup Instructions

### 1. Database Setup
- Ensure MySQL is running on `localhost`
- Create database: `demo2`
- Run schema: `backend/configs/schema.sql`

### 2. Environment Variables
Edit `.env` file:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=demo2
JWT_SECRET=your_secret_key
PORT=3000
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
```

### 3. Dependencies
All required packages are in `package.json`:
- **Node.js + Express**: Web framework
- **mysql2**: Database driver with promise support
- **JWT (jsonwebtoken)**: Authentication tokens
- **bcrypt**: Password hashing
- **multer**: File upload handling
- **nodemailer**: Email sending
- **dotenv**: Environment variable management
- **cors**: Cross-origin resource sharing

### 4. Start Server
```bash
npm start
```

Server runs on `http://localhost:3000`

---

## API ENDPOINTS

### 1. AUTHENTICATION

#### **POST /auth/signup**
Create a new user account
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "patient" // or "doctor"
}
```
Response:
```json
{
  "message": "Signup successful",
  "userId": 1,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "patient"
  }
}
```

#### **POST /auth/login**
Login to existing account
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
Response:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "patient"
  }
}
```

---

### 2. PATIENT PROFILE

#### **POST /profile** (Patient)
Create patient profile (MANDATORY before booking)
```json
{
  "age": 30,
  "gender": "Male",
  "phone": "9876543210",
  "bloodGroup": "O+"
}
```

#### **GET /profile**
Retrieve your profile

#### **PUT /profile** (Patient)
Update profile
```json
{
  "age": 31,
  "phone": "9876543211",
  "profileImageId": 5
}
```

---

### 3. DOCTOR PROFILE

#### **POST /profile** (Doctor)
Create doctor profile
```json
{
  "specialization": "Cardiology",
  "experience": 10,
  "hospitalName": "City Hospital",
  "address": "123 Main St, City"
}
```

#### **GET /profile**
Retrieve your profile (shows `is_verified` status)

#### **PUT /profile** (Doctor)
Update profile
```json
{
  "specialization": "Cardiology",
  "experience": 11,
  "hospitalName": "Premium Hospital",
  "profileImageId": 5,
  "certificateFileId": 8
}
```

---

### 4. DOCTOR APPROVAL SYSTEM

#### **POST /doctor/request-approval** (Doctor only)
Request approval after uploading certificate
```json
{
  "certificateFileId": 5
}
```
**FLOW:**
1. Doctor creates profile
2. Doctor uploads certificate (file_type = 'certificate')
3. Doctor calls this endpoint with file_id
4. Admin reviews and approves/rejects

#### **GET /admin/pending-doctors** (Admin only)
List all pending doctor approval requests

#### **PUT /admin/approve/:approvalId** (Admin only)
Approve a doctor
- Sets `doctor_profiles.is_verified = true`
- Sends email to doctor
- Creates notification

#### **PUT /admin/reject/:approvalId** (Admin only)
Reject a doctor
```json
{
  "adminMessage": "Certificate not clear, please resubmit"
}
```
- Sends rejection email with reason
- Creates notification

---

### 5. APPOINTMENT SLOTS

#### **POST /slots/generate** (Doctor only - must be verified)
Generate 24 slots for a date
```json
{
  "slotDate": "2024-12-25"
}
```
- Creates slots 1-24 for the date
- Prevents duplicates (UNIQUE constraint)
- Requires doctor to be verified

#### **GET /slots?doctorId=1&slotDate=2024-12-25** (Public)
Get all slots (available and booked)

#### **GET /slots/available?doctorId=1&slotDate=2024-12-25** (Public)
Get only available slots for booking

---

### 6. APPOINTMENTS

#### **POST /appointments/book** (Patient only)
Book an appointment
```json
{
  "doctorId": 2,
  "slotId": 15
}
```
**RESTRICTIONS:**
- Patient must have created profile first
- Slot must be active and not booked
- Prevents double booking
- Creates notifications for both

#### **PUT /appointments/cancel/:appointmentId** (Doctor only - must be verified)
Cancel appointment
```json
{
  "cancelReason": "Emergency - reschedule later"
}
```
- Updates appointment status
- Frees the slot
- Sends email to patient
- Creates notification

#### **GET /appointments**
Get your appointments (patient or doctor)
- Returns list with doctor/patient names
- Includes slot dates and status

#### **GET /appointments/:appointmentId**
Get details of specific appointment

---

### 7. FILE MANAGEMENT

#### **POST /files/upload** (Authenticated)
Upload medical report or certificate
```
Content-Type: multipart/form-data
- file: <binary file>
- fileType: medical_report|certificate|profile_image
```
**Features:**
- Accepts: PDF, JPEG, PNG
- Max size: 5MB
- Stores hash (SHA256)
- Local storage in /uploads/

Response:
```json
{
  "message": "File uploaded successfully",
  "fileId": 10,
  "fileName": "report.pdf",
  "fileType": "medical_report"
}
```

#### **GET /files/:fileId** (Authenticated)
Download file
**ACCESS RULES:**
- Owner can always access
- Doctor can access if `record_access.status = 'approved'`
- Check expiration if set

#### **DELETE /files/:fileId** (File owner)
Delete file (removes from disk and DB)

---

### 8. MEDICAL RECORD ACCESS CONTROL

#### **POST /access/request** (Doctor)
Request patient's medical records
```json
{
  "patientId": 3,
  "fileId": 10
}
```
- Creates pending request
- Notifies patient
- Prevents duplicate requests

#### **GET /access/requests**
Get your access requests
- Patient: shows requests FROM doctors
- Doctor: shows requests TO patients

#### **PUT /access/respond/:requestId** (Patient)
Approve or reject access request
```json
{
  "status": "approved",
  "expiresAt": "2024-12-31 23:59:59"
}
```
- `status`: "approved" or "rejected"
- `expiresAt`: (optional) expiration timestamp
- Sends email to doctor
- Creates notification

#### **PUT /access/revoke/:requestId** (Patient)
Revoke previously approved access
- Sets status back to rejected
- Clears expiration
- Creates notification for doctor

---

### 9. CONSULTATION NOTES

#### **POST /consultation** (Doctor)
Write consultation notes for completed appointment
```json
{
  "appointmentId": 5,
  "reasonForVisit": "Chest pain",
  "diagnosis": "High blood pressure",
  "prescription": "Lisinopril 10mg daily",
  "additionalNotes": "Follow-up in 2 weeks"
}
```
**REQUIREMENTS:**
- Appointment must be in 'completed' status
- Only doctor of appointment can write
- One note per appointment

#### **GET /consultation/:appointmentId**
Get consultation notes for appointment
- Both patient and doctor can view

#### **PUT /consultation/:consultationId** (Doctor)
Update consultation notes

---

### 10. REVIEWS

#### **POST /reviews** (Patient)
Leave review for completed appointment
```json
{
  "appointmentId": 5,
  "rating": 5,
  "comment": "Great doctor, very professional"
}
```
**REQUIREMENTS:**
- Appointment status = 'completed'
- Rating: 1-5
- One review per appointment
- Updates doctor's average rating

#### **GET /reviews/:doctorId** (Public)
Get all reviews for a doctor
```json
{
  "stats": {
    "totalReviews": 45,
    "averageRating": "4.75"
  },
  "reviews": [...]
}
```

#### **PUT /reviews/:reviewId** (Patient)
Update your review

---

### 11. NOTIFICATIONS

#### **GET /notifications**
Get all notifications for logged-in user
```json
{
  "total": 5,
  "unread": 2,
  "notifications": [
    {
      "id": 1,
      "type": "doctor_approved",
      "message": "Your doctor profile has been approved...",
      "isRead": false,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### **PUT /notifications/:notificationId/read**
Mark single notification as read

#### **PUT /notifications/read-all**
Mark all notifications as read

---

## NOTIFICATION TYPES

- `doctor_approved`: Doctor profile approved by admin
- `doctor_rejected`: Doctor profile rejected
- `appointment_booked`: New appointment created
- `appointment_cancelled`: Appointment cancelled
- `access_requested`: Doctor requested your records
- `access_granted`: You approved doctor's access
- `access_denied`: You denied doctor's access
- `access_revoked`: Your access to records was revoked

---

## BUSINESS RULES (ENFORCED)

### Doctor Restrictions (Until Verified)
- ❌ Cannot generate appointment slots
- ❌ Cannot cancel appointments
- ❌ Cannot access patient data
- ✅ CAN request approval after profile creation
- ✅ CAN upload certificate

### Patient Restrictions
- ❌ Cannot book appointment until profile created
- ❌ Cannot upload files until profile created
- ✅ CAN request file access
- ✅ CAN revoke access anytime

### File Access Rules
- Doctor can access file ONLY if `record_access.status = 'approved'`
- If `expires_at < NOW()` → deny access
- Patient can revoke anytime

### Security Rules
- Patients cannot access other patients' data
- Doctors cannot access files without approval
- Only appointment doctor/patient can view details

---

## WORKFLOW EXAMPLES

### Complete Doctor Workflow
```
1. Signup with role="doctor"
   POST /auth/signup

2. Create Profile
   POST /profile
   
3. Upload Certificate
   POST /files/upload (fileType: certificate)
   
4. Request Approval
   POST /doctor/request-approval
   
5. [ADMIN] Check Requests
   GET /admin/pending-doctors
   
6. [ADMIN] Approve
   PUT /admin/approve/:id
   ✅ NOW VERIFIED
   
7. Generate Slots
   POST /slots/generate
   
8. View Appointments
   GET /appointments
   
9. Cancel if needed
   PUT /appointments/cancel/:id
   
10. Write Notes (after appointment completes)
    POST /consultation
```

### Complete Patient Workflow
```
1. Signup with role="patient"
   POST /auth/signup

2. Create Profile (MANDATORY)
   POST /profile
   ✅ NOW CAN BOOK

3. View Doctor Slots
   GET /slots/available?doctorId=2&slotDate=2024-12-25

4. Book Appointment
   POST /appointments/book

5. Upload Medical Reports
   POST /files/upload (fileType: medical_report)

6. Check Access Requests
   GET /access/requests

7. Approve/Reject
   PUT /access/respond/:id

8. Can Revoke Anytime
   PUT /access/revoke/:id

9. Review Doctor
   POST /reviews (after appointment completed)
```

---

## ERROR HANDLING

All endpoints return appropriate HTTP status codes:
- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: No token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate/conflict
- `500 Server Error`: Server error

Error Response Format:
```json
{
  "error": "Descriptive error message"
}
```

---

## AUTHENTICATION

Use JWT token in Authorization header:
```
Authorization: Bearer <token>
```

Token expires in 7 days. Get new token by logging in.

---

## FILE UPLOAD TIPS

1. Use multipart/form-data
2. Supported types: PDF, JPEG, PNG
3. Max 5MB per file
4. Files stored in `/uploads/` directory
5. Filenames are hashed with timestamp for uniqueness

---

## NOTES

- All timestamps in UTC
- Password automatically hashed with bcrypt (salt rounds: 10)
- Email system uses Gmail (configure in .env)
- Database uses MySQL 8.0+
- Supports 24 slots per doctor per day
