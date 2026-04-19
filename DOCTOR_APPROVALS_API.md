# Doctor Approvals API - Fixed & Complete Guide

## ✅ Issues Fixed

1. **Database Schema**: Added missing `submitted_at` column to `doctor_approvals` table
2. **Query Optimization**: Fixed SQL queries with proper column aliasing to avoid ambiguity issues
3. **Admin Access**: Added new endpoint for admins to view full doctor details and uploaded files
4. **Error Handling**: Improved error messages and logging

## 📋 API Endpoints

### Admin Endpoints (require admin role)

#### 1. Get Pending Doctor Approvals
```
GET /api/doctor-approvals/pending
Authorization: Bearer {token}
```

**Response:**
```json
{
  "pending": [
    {
      "approvalId": 1,
      "doctorId": 5,
      "status": "pending",
      "submittedAt": "2024-01-15T10:30:00Z",
      "reviewedAt": null,
      "certificateFileId": 12,
      "certificateFileName": "certificate.pdf",
      "doctor": {
        "id": 5,
        "name": "Dr. John Doe",
        "email": "doctor@example.com",
        "specialization": "Cardiology",
        "experience": 10,
        "hospitalName": "City Hospital",
        "address": "123 Main St",
        "isVerified": false
      }
    }
  ],
  "count": 1
}
```

#### 2. Get Doctor Details & Uploaded Files (NEW)
```
GET /api/doctor-approvals/doctor/{doctorId}/details
Authorization: Bearer {token}
```

**Response:**
```json
{
  "approval": {
    "id": 1,
    "status": "pending",
    "submittedAt": "2024-01-15T10:30:00Z",
    "reviewedAt": null,
    "adminMessage": null
  },
  "doctor": {
    "id": 5,
    "name": "Dr. John Doe",
    "email": "doctor@example.com",
    "specialization": "Cardiology",
    "experience": 10,
    "hospitalName": "City Hospital",
    "address": "123 Main St",
    "isVerified": false
  },
  "certificateFile": {
    "id": 12,
    "name": "medical_certificate.pdf",
    "path": "/uploads/certificate-1234567890.pdf"
  },
  "allFiles": [
    {
      "id": 12,
      "name": "medical_certificate.pdf",
      "type": "certificate",
      "uploadedAt": "2024-01-15T10:25:00Z",
      "hashValue": "abc123def456"
    },
    {
      "id": 13,
      "name": "degree.pdf",
      "type": "certificate",
      "uploadedAt": "2024-01-15T10:26:00Z",
      "hashValue": "xyz789uvw012"
    }
  ]
}
```

#### 3. Approve Doctor Request
```
PUT /api/doctor-approvals/{approvalId}/approve
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Doctor approved successfully",
  "doctor": {
    "id": 5,
    "name": "Dr. John Doe",
    "email": "doctor@example.com"
  }
}
```

#### 4. Reject Doctor Request
```
PUT /api/doctor-approvals/{approvalId}/reject
Authorization: Bearer {token}
Content-Type: application/json

{
  "adminMessage": "Certificate requires additional verification"
}
```

**Response:**
```json
{
  "message": "Doctor request rejected",
  "doctor": {
    "id": 5,
    "name": "Dr. John Doe",
    "email": "doctor@example.com"
  }
}
```

### Doctor Endpoints (require doctor role)

#### 1. Get My Approval Status
```
GET /api/doctor-approvals/status
Authorization: Bearer {token}
```

#### 2. Submit Approval Request
```
POST /api/doctor-approvals/request
Authorization: Bearer {token}
Content-Type: application/json

{
  "certificateFileId": 12
}
```

#### 3. Get Approval History
```
GET /api/doctor-approvals/history
Authorization: Bearer {token}
```

## 🔧 Database Schema

The `doctor_approvals` table now includes:
- `id` - Primary key
- `doctor_id` - Foreign key to users table
- `certificate_file_id` - Foreign key to files table
- `status` - ENUM('pending', 'approved', 'rejected')
- `admin_message` - Admin's reason for rejection
- `submitted_at` - Timestamp when request was submitted
- `reviewed_at` - Timestamp when admin reviewed it

## 📁 Files Modified

1. **Backend Models:**
   - `models/DoctorApproval.js` - Fixed SQL queries with proper aliasing
   - `models/File.js` - Added `findAllByUserId()` method

2. **Backend Controllers:**
   - `controllers/doctorApprovalController.js` - Added `getDoctorApprovalDetails()` method

3. **Backend Routes:**
   - `routes/doctorApprovalsRoutes.js` - Added new admin endpoint

4. **Database:**
   - Added `submitted_at` column to `doctor_approvals` table

## 🧪 Testing

Run the test script to verify all endpoints:
```bash
powershell -File test-api.ps1
```

## ✨ Key Features

✅ Admin can view all pending doctor approval requests
✅ Admin can see full doctor profile details
✅ Admin can access all files uploaded by the doctor
✅ Admin can approve or reject requests with custom messages
✅ Doctor receives email notifications on approval/rejection
✅ Doctor can resubmit after rejection
✅ All timestamps are properly tracked
