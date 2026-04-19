# Quick Start - Medical Requests Feature

## 🎯 What Was Added?

### 1. **Patient Profile Now Shows Real Name**
- Instead of generic "Patient", displays the actual patient name from the database
- Updated in sidebar and profile header

### 2. **Medical Requests Section**
Patients can now see and manage all medical record requests from doctors:

```
PENDING Requests
├─ Dr. Smith (Cardiology)
│  ├─ File: chest_xray.pdf
│  ├─ Date: 15 Dec 2024
│  ├─ [View Profile] - Click to see doctor details + appointment history
│  ├─ [✓ Approve]    - Give doctor access to this file
│  └─ [✗ Reject]     - Deny access to this file
│
APPROVED Requests  
├─ Dr. Jones (Neurology)
│  ├─ File: brain_scan.pdf
│  ├─ Approved: 10 Dec 2024
│  ├─ Expires: 31 Mar 2025 (optional)
│  ├─ [View Profile]
│  └─ [Revoke]      - Revoke previously given access
│
REJECTED Requests
└─ Dr. Brown (Cardiology)
   ├─ File: ecg.pdf
   └─ Rejected: 12 Dec 2024
```

### 3. **Doctor Profile Portal**
When clicking "View Profile", patients see:
- Doctor's name, email, specialization
- Experience, hospital, address
- Verification status
- **Full appointment history** with this specific doctor
  - Upcoming appointments
  - Past appointments with dates and status

---

## 🔧 How It Works

### User Flow (Patient)
```
Patient Opens Profile Tab
    ↓
Sees Medical Request Section
    ├─ Pending: Can Approve or Reject
    ├─ Approved: Can Revoke
    └─ Rejected: View-only
    ↓
Clicks "View Profile"
    ↓
Doctor Profile Modal Opens
    ├─ Shows doctor details
    ├─ Shows all appointments with this doctor
    └─ Can close and go back
```

### Backend Flow (Approve)
```
Patient clicks "Approve"
    ↓
Frontend sends: PUT /access/respond/:requestId
    { status: "approved" }
    ↓
Backend:
  - Updates record_access table
  - Sends email to doctor
  - Creates notification
  ↓
Frontend refreshes list
    ↓
Request moves to "APPROVED" section
```

---

## 📍 Where to Find Things

### Frontend Components
```
frontend/src/
├─ components/
│  ├─ MedicalRequests.jsx       ← Main request list
│  ├─ DoctorProfileModal.jsx    ← Doctor profile + appointments
│  └─ PatientProfileModal.jsx   ← (Already exists)
├─ pages/
│  └─ PatientDashboard.jsx      ← Modified to include medical requests
└─ services/
   └─ profileService.js         ← New methods for requests
```

### Backend Endpoints
```
API Routes:
├─ GET  /access/requests                    → Get all requests
├─ PUT  /access/respond/:requestId          → Approve/Reject
├─ PUT  /access/revoke/:requestId           → Revoke access
└─ GET  /appointments/doctor/:doctorId/profile → Get doctor profile + history

Database Tables:
├─ record_access      → Stores request status
├─ appointments       → Stores appointment history
├─ appointment_slots  → Slot information
├─ users              → User data (names, emails)
└─ doctor_profiles    → Doctor details
```

---

## 🧪 Quick Test

### Test 1: Patient Name Display
1. Login as patient
2. Check sidebar - should show patient's real name
3. Check profile card header - should show same name

### Test 2: Medical Requests
1. Have a doctor request access to a file
2. Go to patient profile tab
3. Should see "Medical Report Requests" section
4. Request should appear in "Pending"
5. Click "View Profile" - doctor profile modal opens

### Test 3: Approve/Reject
1. In pending request, click "Approve"
2. Request should move to "Approved" section
3. Reject button should work similarly
4. Rejected requests appear in "Rejected" section

### Test 4: Doctor Profile Modal
1. From a request, click "View Profile"
2. Modal shows:
   - Doctor's name, email, specialization
   - Experience, hospital, address
   - Upcoming and past appointments
3. Close button (X) works
4. Clicking backdrop closes modal

---

## 🎨 UI Styling

### Color Scheme
```
Pending:  🟡 Yellow   (#b07a00) - Needs action
Approved: 🟢 Green    (#1a9e6a) - Access granted
Rejected: 🔴 Red      (#e53e3e) - Access denied
Default:  🔵 Blue     (#3a7bd5) - Primary actions
```

### Responsive Design
```
Mobile (< 768px):
  - Full-width components
  - Stack vertically
  - Touch-friendly buttons

Tablet (768px - 1024px):
  - 2-column layout for profile section
  - List layout for requests

Desktop (> 1024px):
  - Side-by-side profile and upload
  - Full medical requests section
  - Horizontal scrolling if needed
```

---

## 🔐 Security Notes

1. **Authorization**:
   - Only patients see medical requests
   - Doctors cannot view patient requests
   - Admins bypass all checks

2. **Validation**:
   - Can only approve "pending" requests
   - Can only reject "pending" requests
   - Can only revoke "approved" requests

3. **Privacy**:
   - Patients can only view doctors they have appointments with
   - Doctor info is visible but limited to profile + appointment history

---

## 🐛 Troubleshooting

### Issue: Patient name shows as "Patient"
**Cause**: Profile not loaded properly  
**Fix**: Refresh page, ensure user is logged in

### Issue: Medical Requests section not showing
**Cause**: Backend endpoint not returning data  
**Fix**: Check `/access/requests` API response

### Issue: Doctor Profile Modal won't open
**Cause**: Doctor ID not passed correctly  
**Fix**: Verify doctorId in request object

### Issue: Approve/Reject not working
**Cause**: Request already processed  
**Fix**: Refresh list, check request status

---

## 📝 API Response Examples

### GET /access/requests (Patient)
```json
{
  "total": 3,
  "requests": [
    {
      "id": 1,
      "doctorId": 5,
      "doctorName": "Dr. John Smith",
      "fileName": "chest_xray.pdf",
      "status": "pending",
      "requestedAt": "2024-12-15T10:30:00",
      "updatedAt": null,
      "expiresAt": null
    },
    {
      "id": 2,
      "doctorId": 7,
      "doctorName": "Dr. Jane Doe",
      "fileName": "brain_scan.pdf",
      "status": "approved",
      "requestedAt": "2024-12-10T14:20:00",
      "updatedAt": "2024-12-11T09:15:00",
      "expiresAt": "2025-03-31T23:59:59"
    }
  ]
}
```

### GET /appointments/doctor/5/profile (Patient)
```json
{
  "doctor": {
    "id": 5,
    "name": "Dr. John Smith",
    "email": "john@hospital.com",
    "specialization": "Cardiology",
    "experience": 10,
    "hospitalName": "City Hospital",
    "address": "123 Medical Street, New York",
    "isVerified": true,
    "rating": 4.8
  },
  "appointmentHistory": [
    {
      "id": 1,
      "slotDate": "2024-12-20",
      "slotNumber": 5,
      "slotStartTime": "09:00:00",
      "slotEndTime": "09:30:00",
      "status": "confirmed",
      "cancelReason": null,
      "createdAt": "2024-12-10T10:30:00"
    },
    {
      "id": 2,
      "slotDate": "2024-11-15",
      "slotNumber": 3,
      "slotStartTime": "10:30:00",
      "slotEndTime": "11:00:00",
      "status": "completed",
      "cancelReason": null,
      "createdAt": "2024-11-01T15:45:00"
    }
  ]
}
```

---

## ✨ Features at a Glance

| Feature | Benefit |
|---------|---------|
| Real patient names | More personal, less confusing |
| Medical requests panel | Centralized record request management |
| Approve/Reject UI | Easy one-click decisions |
| Doctor profile view | Learn about doctors you work with |
| Appointment history | See full history with each doctor |
| Status indicators | Clear visual feedback |
| Date formatting | Consistent, readable dates |

---

## 🚀 Next Steps

1. **Test** the feature thoroughly
2. **Deploy** backend changes first
3. **Deploy** frontend changes
4. **Monitor** for any issues
5. **Gather** user feedback
6. **Iterate** with improvements

---

## 📞 Questions?

Refer to the main documentation:
- `PATIENT_PROFILE_ENHANCEMENT_GUIDE.md` - Detailed implementation
- Backend API docs - `API_DOCUMENTATION.md`
- Database schema - `backend/configs/schema.sql`
