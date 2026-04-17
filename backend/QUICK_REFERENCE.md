# Healthcare Platform - Quick Reference Card

## 🚀 Getting Started (5 Minutes)

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Setup Database
```bash
mysql -u root -p
CREATE DATABASE demo2;
SOURCE /path/to/configs/schema.sql;
```

### 3. Configure Environment
```bash
# Edit .env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=demo2
JWT_SECRET=your_secret
EMAIL_USER=your-email@gmail.com
```

### 4. Start Server
```bash
npm start
```

✅ Server runs on `http://localhost:3000`

---

## 📡 Core API Endpoints

### Authentication
```
POST   /auth/signup              (name, email, password, role)
POST   /auth/login               (email, password)
```

### Profiles
```
POST   /profile                  (Create patient/doctor profile)
GET    /profile                  (Get your profile)
PUT    /profile                  (Update profile)
```

### Doctor Approval
```
POST   /doctor/request-approval  (certificateFileId) [DOCTOR]
GET    /admin/pending-doctors    [ADMIN]
PUT    /admin/approve/:id        [ADMIN]
PUT    /admin/reject/:id         (adminMessage) [ADMIN]
```

### Appointments
```
POST   /slots/generate           (slotDate) [VERIFIED DOCTOR]
GET    /slots                    (doctorId, slotDate)
GET    /slots/available          (doctorId, slotDate)
POST   /appointments/book        (doctorId, slotId) [PATIENT+PROFILE]
PUT    /appointments/cancel/:id  (cancelReason) [VERIFIED DOCTOR]
GET    /appointments             [PATIENT/DOCTOR]
```

### Medical Records
```
POST   /files/upload             (file, fileType) [AUTH]
GET    /files/:id                [AUTH WITH ACCESS]
DELETE /files/:id                [OWNER]

POST   /access/request           (patientId, fileId) [DOCTOR]
GET    /access/requests          [PATIENT/DOCTOR]
PUT    /access/respond/:id       (status, expiresAt) [PATIENT]
PUT    /access/revoke/:id        [PATIENT]
```

### Consultation & Reviews
```
POST   /consultation             (appointmentId, ...) [DOCTOR]
GET    /consultation/:id         [DOCTOR/PATIENT]
PUT    /consultation/:id         [DOCTOR]

POST   /reviews                  (appointmentId, rating, comment) [PATIENT]
GET    /reviews/:doctorId        (PUBLIC)
PUT    /reviews/:id              [PATIENT]
```

### Notifications
```
GET    /notifications            [AUTH]
PUT    /notifications/:id/read   [AUTH]
PUT    /notifications/read-all   [AUTH]
```

---

## 🔑 Key Business Rules

| Rule | Requirement |
|------|-------------|
| Doctor Slots | Must be verified first |
| Patient Booking | Must create profile first |
| File Access | Need approval from patient |
| Reviews | Appointment must be completed |
| Cancel Appointment | Only verified doctor can cancel |
| Revoke Access | Only patient can revoke |

---

## 🗄️ Database Tables

| Table | Purpose |
|-------|---------|
| users | Accounts (patient/doctor/admin) |
| doctor_profiles | Doctor info + verification status |
| patient_profiles | Patient medical info |
| doctor_approvals | Approval workflow |
| appointment_slots | 24 slots per doctor/day |
| appointments | Bookings with status |
| files | Uploaded documents |
| record_access | Access requests + expiry |
| consultation_notes | Doctor notes |
| reviews | Ratings + comments |
| notifications | User alerts |

---

## 🔒 Authentication

Add to all protected requests:
```
Authorization: Bearer <jwt_token>
```

Token obtained from login endpoint. Valid for 7 days.

---

## 📧 Email Notifications Sent For

- Doctor profile approved
- Doctor profile rejected
- Appointment cancelled
- Medical record access approved
- Medical record access denied

---

## 💾 File Upload

- **Types**: certificate, medical_report, profile_image
- **Formats**: PDF, JPEG, PNG
- **Max Size**: 5MB
- **Storage**: Local `/uploads/` directory

---

## 📊 Response Format

### Success (200/201)
```json
{
  "message": "Action successful",
  "data": { ... }
}
```

### Error (400/401/403/404/500)
```json
{
  "error": "Descriptive error message"
}
```

---

## 🧪 Quick Test Commands

### Doctor Approval Workflow
```bash
# 1. Doctor signup
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Dr. John","email":"john@doc.com","password":"pass123","role":"doctor"}'

# 2. Create profile
curl -X POST http://localhost:3000/profile \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"specialization":"Cardiology","experience":10,"hospitalName":"Hospital","address":"Address"}'

# 3. Upload certificate
curl -X POST http://localhost:3000/files/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@cert.pdf" \
  -F "fileType=certificate"

# 4. Request approval
curl -X POST http://localhost:3000/doctor/request-approval \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"certificateFileId":1}'
```

---

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Can't connect to DB | Check MySQL running, .env credentials |
| File upload fails | Ensure /uploads dir exists, file < 5MB |
| Token expired | Login again |
| Access denied | Check user role & authorization |
| No email received | Configure EMAIL_USER, EMAIL_PASSWORD |

---

## 📚 Full Documentation

- **README.md** - Overview & architecture
- **API_DOCUMENTATION.md** - All endpoints + detailed examples
- **TESTING_GUIDE.md** - Testing workflows + cURL commands
- **IMPLEMENTATION_SUMMARY.md** - What was built & verification

---

## 🔗 Port Information

- **Server**: 3000
- **Database**: 3306 (MySQL default)
- **File Upload**: Via /files/upload endpoint
- **Public Files**: /uploads/* (restricted by auth)

---

## 📋 Deployment Checklist

- [ ] Database created and schema imported
- [ ] .env file configured
- [ ] npm install completed
- [ ] Email credentials configured (optional)
- [ ] /uploads directory writable
- [ ] npm start runs without errors
- [ ] Health check: GET /health returns 200

---

## 🎯 Core Workflows at a Glance

### Doctor Path: Approval → Slots → Appointments
```
Signup → Profile → Certificate → Request Approval 
→ Admin Approves → Generate Slots → Manage Appointments
```

### Patient Path: Profile → Search → Book → Review
```
Signup → Profile → View Slots → Book Appointment 
→ Upload Reports → Manage Access → Leave Review
```

### Admin Path: Review → Approve/Reject
```
GET Pending Doctors → PUT Approve or Reject
```

---

## 📞 Support

- Check API_DOCUMENTATION.md for endpoint details
- Review TESTING_GUIDE.md for working examples
- See IMPLEMENTATION_SUMMARY.md for feature verification

---

**Everything is ready to use! Start with `npm start` and refer to documentation for details.**
