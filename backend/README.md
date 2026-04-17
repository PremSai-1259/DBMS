# Healthcare Platform Backend

A production-ready healthcare system backend built with **Node.js, Express, and MySQL**. Implements doctor verification, appointment scheduling, medical record management, and file access control.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────┐
│         Express Server (Port 3000)      │
├─────────────────────────────────────────┤
│  Authentication & Authorization Layer   │
│  (JWT + Role-based Middleware)          │
├─────────────────────────────────────────┤
│  Controllers & Business Logic           │
│  (Appointment, Profile, Access, etc)    │
├─────────────────────────────────────────┤
│  Data Models (DB Query Handlers)        │
├─────────────────────────────────────────┤
│  MySQL Database (demo2)                 │
└─────────────────────────────────────────┘
```

## 📋 Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js |
| Framework | Express 5.x |
| Database | MySQL 8.0+ |
| DB Driver | mysql2 (with promises) |
| Authentication | JWT + bcrypt |
| File Upload | multer (local storage) |
| Email | nodemailer |
| Config | dotenv |

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 14+
- MySQL 8.0+
- npm or yarn

### 2. Installation

```bash
cd backend
npm install
```

### 3. Database Setup

```bash
# Connect to MySQL
mysql -u root -p

# Run schema
SOURCE configs/schema.sql;
```

### 4. Environment Configuration

Create/Update `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=demo2
JWT_SECRET=your_secret_key
PORT=3000
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
```

### 5. Start Server

```bash
npm start
```

Server runs on `http://localhost:3000`

---

## 📁 Project Structure

```
backend/
├── configs/
│   ├── db.js              # MySQL connection (promise-based)
│   └── schema.sql         # Database schema with all tables
│
├── controllers/           # Business logic for each feature
│   ├── authController.js          # Signup/Login
│   ├── profileController.js       # Patient & Doctor profiles
│   ├── doctorApprovalController.js # Doctor verification workflow
│   ├── appointmentController.js   # Appointment booking/cancellation
│   ├── slotController.js          # Slot generation & listing
│   ├── fileController.js          # File upload & download
│   ├── accessController.js        # Medical record access requests
│   ├── consultationController.js  # Consultation notes
│   ├── reviewController.js        # Doctor reviews/ratings
│   └── notificationController.js  # Notification management
│
├── models/                # Database query handlers
│   ├── User.js
│   ├── DoctorProfile.js
│   ├── PatientProfile.js
│   ├── DoctorApproval.js
│   ├── AppointmentSlot.js
│   ├── Appointment.js
│   ├── File.js
│   ├── RecordAccess.js
│   ├── ConsultationNote.js
│   ├── Review.js
│   └── Notification.js
│
├── routes/                # API endpoint definitions
│   ├── authRoutes.js
│   ├── profileRoutes.js
│   ├── doctorRoutes.js
│   ├── slotRoutes.js
│   ├── appointmentRoutes.js
│   ├── fileRoutes.js
│   ├── accessRoutes.js
│   ├── consultationRoutes.js
│   ├── reviewRoutes.js
│   └── notificationRoutes.js
│
├── middleware/            # Custom middleware
│   ├── authMiddleware.js    # JWT verification
│   └── roleMiddleware.js    # Role-based access control
│
├── utils/
│   └── helpers.js         # Password hashing, JWT, email, file hash
│
├── uploads/               # Local file storage (auto-created)
│
├── index.js              # Main server entry point
├── package.json          # Dependencies
├── .env                  # Environment variables
└── API_DOCUMENTATION.md  # Complete API reference
```

---

## 🔐 Security Features

✅ **Password Security**
- Bcrypt hashing (10 salt rounds)
- No plaintext passwords stored

✅ **Authentication**
- JWT tokens with 7-day expiration
- Token verification on protected routes

✅ **Authorization**
- Role-based access control (patient, doctor, admin)
- Resource-level permissions

✅ **File Security**
- SHA256 hash for file integrity
- Local storage (not exposed directly)
- Access control verification required

✅ **Data Privacy**
- Patients cannot access other patients' data
- Doctors cannot access files without approval
- Record access expiration enforced

---

## 📊 Database Schema

### Key Tables

| Table | Purpose | Special Columns |
|-------|---------|-----------------|
| `users` | User accounts | role: patient/doctor/admin |
| `doctor_profiles` | Doctor details | is_verified, average_rating |
| `patient_profiles` | Patient details | blood_group |
| `doctor_approvals` | Doctor verification workflow | UNIQUE(doctor_id) |
| `appointment_slots` | Available slots (1-24/day) | UNIQUE(doctor_id, slot_date, slot_number) |
| `appointments` | Bookings | cancel_reason |
| `files` | Uploaded documents | file_type, hash_value |
| `record_access` | Medical record requests | expires_at, updated_at |
| `consultation_notes` | Doctor notes | UNIQUE(appointment_id) |
| `reviews` | Patient ratings | UNIQUE(appointment_id) |
| `notifications` | User alerts | type column |

---

## 🔄 Core Workflows

### Doctor Approval Flow
```
Doctor Signup
    ↓
Create Profile
    ↓
Upload Certificate (PDF)
    ↓
Request Approval (POST /doctor/request-approval)
    ↓
[ADMIN] Review & Approve (PUT /admin/approve/:id)
    ↓
Email sent to doctor ✉️
    ↓
is_verified = TRUE ✅
    ↓
Can now:
  • Generate appointment slots
  • Cancel appointments
  • Request patient records
```

### Patient Booking Flow
```
Patient Signup
    ↓
Create Profile (MANDATORY)
    ↓
View Available Slots (GET /slots/available)
    ↓
Book Appointment (POST /appointments/book)
    ↓
Slot marked as booked ✓
    ↓
Notification created 📧
```

### Medical Record Access Flow
```
Patient: Uploads Medical Report
    ↓
Doctor: Requests Access (POST /access/request)
    ↓
Patient: Receives Notification 📧
    ↓
Patient: Approve/Reject (PUT /access/respond/:id)
    ↓
Doctor: Notified (can now view file)
    ↓
Optional: Patient can revoke anytime
```

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Role | Purpose |
|--------|----------|------|---------|
| POST | `/auth/signup` | - | Create account |
| POST | `/auth/login` | - | Login |
| POST | `/profile` | Patient/Doctor | Create profile |
| GET | `/profile` | Patient/Doctor | Get profile |
| PUT | `/profile` | Patient/Doctor | Update profile |
| POST | `/doctor/request-approval` | Doctor | Request verification |
| GET | `/admin/pending-doctors` | Admin | View pending requests |
| PUT | `/admin/approve/:id` | Admin | Approve doctor |
| PUT | `/admin/reject/:id` | Admin | Reject doctor |
| POST | `/slots/generate` | Doctor | Create 24 slots |
| GET | `/slots` | Public | List slots |
| POST | `/appointments/book` | Patient | Book appointment |
| PUT | `/appointments/cancel/:id` | Doctor | Cancel appointment |
| GET | `/appointments` | Patient/Doctor | List appointments |
| POST | `/files/upload` | Auth | Upload file |
| GET | `/files/:id` | Auth | Download file |
| POST | `/access/request` | Doctor | Request record access |
| PUT | `/access/respond/:id` | Patient | Approve/reject access |
| PUT | `/access/revoke/:id` | Patient | Revoke access |
| POST | `/consultation` | Doctor | Write notes |
| POST | `/reviews` | Patient | Leave review |
| GET | `/reviews/:doctorId` | Public | Get reviews |
| GET | `/notifications` | Auth | Get notifications |

---

## 🚨 Key Business Rules (Enforced)

### Doctor Restrictions (Before Verification)
```javascript
if (!doctor.is_verified) {
  ❌ Cannot generate slots
  ❌ Cannot cancel appointments
  ❌ Cannot access patient data
}
```

### Patient Restrictions
```javascript
if (!patientProfile) {
  ❌ Cannot book appointments
  ❌ Cannot upload files
}
```

### File Access Control
```javascript
if (doctor wants to access file) {
  if (record_access.status === 'approved' && 
      (expires_at IS NULL OR expires_at > NOW())) {
    ✅ Grant access
  } else {
    ❌ Deny access
  }
}
```

### Review Eligibility
```javascript
if (appointment.status === 'completed') {
  ✅ Patient can review
} else {
  ❌ Cannot review yet
}
```

---

## 📧 Email Notifications

Automated emails sent for:
- ✉️ Doctor approval/rejection
- ✉️ Appointment cancellation
- ✉️ Medical record access approval/denial
- ✉️ Access revocation

---

## 🛠️ Development Notes

### Adding New Endpoints

1. Create controller method in `controllers/`
2. Create/update route in `routes/`
3. Add middleware as needed:
   - `authMiddleware` for authentication
   - `roleMiddleware(['doctor'])` for authorization
4. Mount route in `index.js`

### Database Queries

Use promise-based mysql2:
```javascript
const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
const [result] = await db.execute('INSERT INTO ...', [values]);
```

### Error Handling

All controllers catch errors and return JSON:
```javascript
catch (error) {
  console.error('Error:', error);
  res.status(500).json({ error: error.message });
}
```

---

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| Cannot connect to DB | Check MySQL is running, credentials in .env |
| File upload fails | Check /uploads directory exists, file size < 5MB |
| Email not sending | Configure EMAIL_USER and EMAIL_PASSWORD in .env |
| Token expired | Login again to get new token |
| Access denied | Verify user role and authentication token |

---

## 📈 Performance Considerations

- Database queries use parameterized queries (prevent SQL injection)
- Files stored locally (faster than cloud storage)
- JWT tokens reduce DB queries per request
- Indexes on foreign keys and UNIQUE constraints
- Connection pooling via mysql2

---

## 🧪 Testing Checklist

- [ ] Doctor signup → create profile → request approval → admin approval flow
- [ ] Patient signup → create profile → book appointment
- [ ] File upload → access request → approval → download
- [ ] Cancel appointment → slot freed → rebookable
- [ ] Revoke access → doctor cannot view
- [ ] Expired access → automatic denial
- [ ] Notifications created for all actions
- [ ] Email sent for critical events

---

## 📝 License

Private

---

## 👨‍💻 Support

For issues or questions, check `API_DOCUMENTATION.md` for detailed endpoint information.
