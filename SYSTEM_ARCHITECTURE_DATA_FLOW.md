# System Architecture & Data Flow

## 1. Patient Profile Enhancement Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     PATIENT DASHBOARD                            │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │   PROFILE    │ │ APPOINTMENTS │ │    FIND      │
        │    TAB       │ │     TAB      │ │   DOCTORS    │
        └──────────────┘ └──────────────┘ └──────────────┘
                │
        ┌───────┴────────────┐
        ▼                    ▼
   ┌──────────────┐  ┌──────────────────────┐
   │   PROFILE    │  │ MEDICAL REQUESTS     │
   │   DETAILS    │  │ ├─ Pending          │
   │ ├─ Name ✅    │  │ ├─ Approved         │
   │ ├─ Email     │  │ └─ Rejected         │
   │ ├─ Phone     │  │                     │
   │ ├─ Age       │  │ [View Profile] ┐    │
   │ └─ Blood     │  │ [Approve]      │    │
   │              │  │ [Reject]       ├──┐ │
   └──────────────┘  └──────────────────┤─┘
                                        │
                                        ▼
                                ┌───────────────┐
                                │ DOCTOR PROFILE│
                                │ MODAL         │
                                ├───────────────┤
                                │ Doctor Info   │
                                │ - Name        │
                                │ - Experience  │
                                │ - Hospital    │
                                │ - Verified    │
                                ├───────────────┤
                                │ APPOINTMENTS  │
                                │ - Upcoming    │
                                │ - Past        │
                                └───────────────┘
```

---

## 2. Request Lifecycle

```
DOCTOR REQUESTS ACCESS
        │
        ▼
    ┌─────────┐
    │ PENDING │  ← Patient sees this
    │  Status │
    └────┬────┘
         │
    ┌────┴────────────────┐
    │                     │
    ▼                     ▼
┌────────────┐      ┌──────────┐
│  APPROVED  │      │ REJECTED │
│ Status     │      │ Status   │
└────┬───────┘      └──────────┘
     │
     ▼ (Over time)
┌──────────────┐
│ EXPIRED      │ (If expiration date set)
│ Status       │
└──────────────┘
```

---

## 3. Component Hierarchy

```
PatientDashboard
├─ Profile Tab
│  ├─ Profile Details Box
│  │  └─ User Info (Name, Email, Phone, etc.)
│  ├─ FileUploadModal
│  ├─ ProfileFilesList
│  │  └─ Medical Report Cards
│  └─ MedicalRequests ✨ NEW
│     ├─ Pending Requests Section
│     │  ├─ Request Card
│     │  │  ├─ Doctor Name
│     │  │  ├─ File Name
│     │  │  ├─ [View Profile] Button
│     │  │  ├─ [✓ Approve] Button
│     │  │  └─ [✗ Reject] Button
│     │  └─ Request Card (multiple)
│     ├─ Approved Requests Section
│     │  ├─ Request Card
│     │  │  ├─ Doctor Name
│     │  │  ├─ File Name
│     │  │  ├─ Expiration Date
│     │  │  ├─ [View Profile] Button
│     │  │  └─ [Revoke] Button
│     │  └─ Request Card (multiple)
│     └─ Rejected Requests Section
│        └─ Request Card (view-only)
│
└─ DoctorProfileModal (Overlay) ✨ NEW
   ├─ Doctor Info Section
   │  ├─ Name & Specialization
   │  ├─ Email & Verification
   │  ├─ Experience & Hospital
   │  └─ Address
   └─ Appointment History Section
      ├─ Upcoming Appointments
      │  ├─ Appointment Card
      │  │  ├─ Date & Time
      │  │  └─ Status Badge
      │  └─ Appointment Card (multiple)
      └─ Past Appointments
         ├─ Appointment Card (scrollable)
         └─ Appointment Card (multiple)
```

---

## 4. Data Flow - Approve Request

```
┌──────────────┐
│ PATIENT UI   │ Clicks "Approve" button
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────┐
│ MedicalRequests Component            │
│ handleApprove(requestId)             │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ profileService.respondToMedicalRequest│
│ PUT /access/respond/:requestId       │
│ { status: "approved" }               │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Backend: accessController            │
│ respondToRequest()                   │
│ ├─ Verify patient owns file          │
│ ├─ Verify request is pending         │
│ ├─ Update record_access table        │
│ ├─ Send email to doctor              │
│ ├─ Create notification for doctor    │
│ └─ Return success response           │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Frontend receives response           │
│ loadRequests() - refresh list        │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Request now shows in APPROVED section│
│ with expiration date (if set)        │
└──────────────────────────────────────┘
```

---

## 5. Database Tables Used

```
┌─────────────────────────────────────────────────────────────┐
│                    USERS TABLE                              │
│ id (PK) | name | email | password | role | created_at      │
└─────────────────────────────────────────────────────────────┘
                    ▲           ▲
                    │           │
        ┌───────────┘           └──────────┐
        │                                  │
        ▼                                  ▼
┌──────────────────────┐    ┌──────────────────────┐
│ PATIENT_PROFILES     │    │ DOCTOR_PROFILES      │
│ id | user_id (FK)    │    │ id | user_id (FK)    │
│ age | gender         │    │ specialization       │
│ phone | blood_group  │    │ experience           │
│ created_at           │    │ hospital_name        │
│                      │    │ address              │
│                      │    │ is_verified          │
└──────────────────────┘    │ average_rating       │
        ▲                    │ created_at           │
        │                    └──────────────────────┘
        │                            ▲
        │                            │
        │                            │
        │          ┌─────────────────┴──────────────┐
        │          │                                │
        │          ▼                                ▼
        │    ┌──────────────────────┐    ┌──────────────────────┐
        │    │  RECORD_ACCESS       │    │   APPOINTMENTS       │
        │    │  (Medical Requests)  │    │                      │
        │    │ id (PK)              │    │ id (PK)              │
        │    │ patient_id (FK) ─────┼─┬──│ patient_id (FK)      │
        │    │ doctor_id (FK) ──────┼─┤  │ doctor_id (FK)       │
        │    │ file_id (FK)         │ │  │ slot_id (FK)         │
        │    │ status               │ │  │ status               │
        │    │ requested_at         │ │  │ created_at           │
        │    │ updated_at           │ │  │ cancel_reason        │
        │    │ expires_at           │ │  └──────────────────────┘
        │    └──────────────────────┘ │           ▲
        │                             │           │
        │                             └───────────┘
        │
        └─────────────────────────────────┘ (Patient in both)

┌──────────────────────┐     ┌──────────────────────┐
│  APPOINTMENT_SLOTS   │     │   CONSULTATION_NOTES │
│ id (PK)              │     │ id (PK)              │
│ doctor_id (FK)       │     │ appointment_id (FK)  │
│ slot_date            │     │ doctor_id (FK)       │
│ slot_number          │     │ patient_id (FK)      │
│ slot_start_time      │     │ reason_for_visit     │
│ slot_end_time        │     │ diagnosis            │
│ is_available         │     │ prescription         │
│ is_booked            │     │ additional_notes     │
└──────────────────────┘     │ created_at           │
                             │ updated_at           │
                             └──────────────────────┘
```

---

## 6. API Endpoints Flow

```
PATIENT WORKFLOW
═════════════════════════════════════════════════════════════

1. LOGIN
   POST /auth/signin
   { email, password }
   ↓ Returns: { token, user: { id, name, email, role } }

2. LOAD PROFILE PAGE
   GET /profile
   ↓ Returns: { profile: { id, user_id, name, email, phone, age, ... } }

3. LOAD MEDICAL REQUESTS ✨ NEW
   GET /access/requests
   ↓ Returns: { 
       total: 3,
       requests: [
         { id, doctorId, doctorName, fileName, status, ... },
         ...
       ]
     }

4. VIEW DOCTOR PROFILE (Click "View Profile") ✨ NEW
   GET /appointments/doctor/:doctorId/profile
   ↓ Returns: {
       doctor: { id, name, email, specialization, experience, ... },
       appointmentHistory: [
         { id, slotDate, slotNumber, slotStartTime, slotEndTime, status, ... },
         ...
       ]
     }

5. APPROVE/REJECT REQUEST ✨ NEW
   PUT /access/respond/:requestId
   { status: "approved" | "rejected", expiresAt?: "2025-03-31" }
   ↓ Returns: { message, requestId, status }
   ↓ Sends email to doctor
   ↓ Creates notification

6. UPLOAD MEDICAL FILE
   POST /files/upload
   { file, file_type: "medical_report" }
   ↓ Returns: { fileId, fileName, uploadedAt }
   ↓ Now visible to doctors requesting access

7. REVOKE ACCESS ✨ FUTURE
   PUT /access/revoke/:requestId
   ↓ Returns: { message }
   ↓ Request status changes to "rejected"
```

---

## 7. Status Transitions

```
RECORD_ACCESS STATUS FLOW

Created by Doctor
        │
        ▼
    ┌────────────┐
    │  PENDING   │ ← Doctor waiting for response
    │            │
    └────┬───────┘
         │
    ┌────┴──────────────────────┐
    │                           │
    ▼ (Patient Approves)       ▼ (Patient Rejects)
┌────────────┐             ┌──────────────┐
│ APPROVED   │             │  REJECTED    │
│ Access OK  │             │  Access Denied
└────┬───────┘             └──────────────┘
     │
     ├─ Time passes...
     │
     ▼ (If expires_at set)
┌──────────────────┐
│ AUTO-REJECTED    │
│ (Past expiry)    │
└──────────────────┘

Patient can REVOKE
from APPROVED
        │
        ▼
    ┌────────────┐
    │ REJECTED   │
    │ (Revoked)  │
    └────────────┘
```

---

## 8. Security & Validation

```
AUTHORIZATION CHECKS
═════════════════════════════════════════════════════════════

Endpoint: GET /access/requests
├─ User must be logged in (authMiddleware) ✓
├─ If patient: return requests FROM doctors
├─ If doctor: return requests TO patients
└─ Return 403 if invalid role

Endpoint: PUT /access/respond/:requestId
├─ User must be logged in ✓
├─ User must be patient ✓
├─ Request must exist ✓
├─ Patient must own the file ✓
│  (request.patient_id == req.user.id)
├─ Request must be pending ✓
│  (request.status == 'pending')
├─ Status must be valid ✓
│  ('approved' or 'rejected')
└─ Update database ✓

Endpoint: GET /appointments/doctor/:doctorId/profile
├─ User must be logged in ✓
├─ User must be patient ✓
├─ Doctor must exist ✓
├─ Doctor must have profile ✓
├─ Patient must have appointment with doctor ✓
│  (hasDoctorPatientRelationship check)
└─ Return doctor info + appointment history ✓
```

---

## 9. Error Handling

```
COMMON ERRORS & RESPONSES
═════════════════════════════════════════════════════════════

400 Bad Request
├─ Missing required fields
├─ Invalid status value
└─ Invalid request data

403 Forbidden
├─ User not authorized
├─ Patient doesn't own the file
└─ Doctor not found for patient

404 Not Found
├─ Request not found
├─ File not found
├─ Doctor profile not found
└─ Patient doesn't have appointment with doctor

409 Conflict
├─ Access request already exists
└─ Can't perform action on current status

500 Server Error
├─ Database error
├─ Email sending failed
└─ Notification creation failed

Frontend handles with Toast notifications:
- Success (green): Operation completed
- Error (red): Show error message
- Warning (yellow): Confirm before proceeding
```

---

## 10. Real-time Updates

```
REFRESH FLOW
═════════════════════════════════════════════════════════════

After Approve/Reject/Revoke:

1. Component calls loadRequests()
2. Makes GET /access/requests
3. Backend returns updated list
4. UI updates in real-time
5. Request moves to appropriate section
6. User sees immediate feedback

Toast message shows:
✅ "Request approved" (Green)
❌ "Request rejected" (Red)
ℹ️ "Request revoked" (Blue)
```

This architecture ensures:
- ✅ Secure access control
- ✅ Real-time updates
- ✅ Clean separation of concerns
- ✅ Extensible design
- ✅ User-friendly interface
