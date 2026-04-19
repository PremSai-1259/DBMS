# Admin Doctor Approval Review Guide

## Overview
Admins can now access and review doctor profile information and uploaded files through the doctor approvals system.

## Step-by-Step Admin Workflow

### Step 1: Get All Pending Approvals
**Endpoint**: `GET /api/doctor-approvals/pending`

```bash
curl -X GET "http://localhost:5000/api/doctor-approvals/pending" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**This returns**:
- List of all doctors with pending approvals
- Doctor basic info (name, email, specialization, experience)
- Approval submission timestamps
- Hospital name and address

### Step 2: View Detailed Doctor Profile & Files
**Endpoint**: `GET /api/doctor-approvals/doctor/{doctorId}/details`

```bash
curl -X GET "http://localhost:5000/api/doctor-approvals/doctor/5/details" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**This returns**:
- ✅ Complete doctor profile details
- ✅ Approval status and history
- ✅ Certificate file information
- ✅ **All uploaded files by the doctor**
- ✅ File metadata (type, upload date, hash)

### Step 3: Review Doctor Information

Before approving, admin should verify:
1. **Profile Information**
   - Name matches documents
   - Specialization is verified
   - Years of experience is reasonable
   - Hospital affiliation exists

2. **Uploaded Files**
   - Certificate files are present
   - Files are authentic (check hash values)
   - No suspicious files
   - All required documents included

### Step 4: Make Approval Decision

#### Option A: APPROVE
```bash
curl -X PUT "http://localhost:5000/api/doctor-approvals/1/approve" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**After approval**:
- Doctor marked as verified
- Doctor receives approval email
- Doctor can create appointment slots
- Doctor can accept patient appointments

#### Option B: REJECT
```bash
curl -X PUT "http://localhost:5000/api/doctor-approvals/1/reject" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "adminMessage": "Medical degree certificate needs to be notarized. Please resubmit with certified copy."
  }'
```

**After rejection**:
- Doctor receives rejection email with reason
- Doctor can resubmit with corrections
- Doctor can try approval process again

---

## API Response Details

### Pending Approvals Response
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
      "certificateFileName": "medical_cert.pdf",
      "doctor": {
        "id": 5,
        "name": "Dr. John Doe",
        "email": "john.doe@example.com",
        "specialization": "Cardiology",
        "experience": 10,
        "hospitalName": "City Heart Hospital",
        "address": "123 Main St, New York, NY",
        "isVerified": false
      }
    }
  ],
  "count": 1
}
```

### Doctor Details Response
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
    "email": "john.doe@example.com",
    "specialization": "Cardiology",
    "experience": 10,
    "hospitalName": "City Heart Hospital",
    "address": "123 Main St, New York, NY",
    "isVerified": false
  },
  "certificateFile": {
    "id": 12,
    "name": "medical_cert.pdf",
    "path": "/uploads/certificate-1234567890.pdf"
  },
  "allFiles": [
    {
      "id": 12,
      "name": "medical_cert.pdf",
      "type": "certificate",
      "uploadedAt": "2024-01-15T10:25:00Z",
      "hashValue": "e3b0c44298fc1c149afbf4c8996fb924"
    },
    {
      "id": 13,
      "name": "degree.pdf",
      "type": "certificate",
      "uploadedAt": "2024-01-15T10:26:00Z",
      "hashValue": "8a7b9d6c3e2f1a0b5c9d4e3f2a1b0c5d"
    },
    {
      "id": 14,
      "name": "experience_letter.pdf",
      "type": "medical_report",
      "uploadedAt": "2024-01-15T10:27:00Z",
      "hashValue": "f1e2d3c4b5a6978839201f1e2d3c4b5a"
    }
  ]
}
```

---

## Checking File Authenticity

### File Metadata Available
- **ID**: Unique file identifier
- **Name**: Original filename
- **Type**: File classification (certificate, medical_report)
- **Upload Date**: When file was uploaded
- **Hash Value**: Unique signature for file verification

### Using Hash Values
- Compare hashes to detect tampering
- Identical files have identical hashes
- Modified files produce different hashes
- Store hashes for audit trail

---

## Admin Checklist for Doctor Approval

- [ ] **Identity Verification**
  - [ ] Doctor name matches credentials
  - [ ] Email address is valid/verified
  - [ ] At least one certificate file present

- [ ] **Qualifications Review**
  - [ ] Medical degree certificate valid
  - [ ] Specialization matches claimed field
  - [ ] Years of experience reasonable (typically 2+)
  - [ ] No contradictions in documents

- [ ] **Hospital Information**
  - [ ] Hospital name is real/verifiable
  - [ ] Address is complete and valid
  - [ ] No suspicious or invalid addresses

- [ ] **File Review**
  - [ ] All required files present
  - [ ] Files are legitimate documents (not generic PDFs)
  - [ ] File sizes are reasonable
  - [ ] Upload dates make sense
  - [ ] Hash values match if duplicates exist

- [ ] **Final Decision**
  - [ ] All checks passed → APPROVE
  - [ ] Issues found → Provide specific REJECTION reason

---

## Common Rejection Reasons

```
"Medical degree certificate needs verification through official channels"
"Certificate has expired, please provide current certification"
"Years of experience seems inconsistent with documents provided"
"Hospital information could not be verified"
"Certificate appears to be a photocopy, please provide certified original"
"Missing required medical license document"
"Address information is incomplete or invalid"
```

---

## Error Handling

### Possible Errors
```json
{
  "error": "Approval request not found"
}
```
- Check that approvalId is correct
- Approval might have already been reviewed

```json
{
  "error": "Request is already approved"
}
```
- Doctor approval already processed
- Cannot reapprove same request

```json
{
  "error": "No pending approval found for this doctor"
}
```
- Use the pending approvals endpoint first
- Ensure you're using correct doctorId

---

## Performance Tips

1. **Batch Operations**: Use pending approvals endpoint to get all at once
2. **Pagination**: Consider implementing pagination for large result sets
3. **Filtering**: Filter by date or specialization if available
4. **Caching**: Cache doctor details between approvals if needed

---

## Security Notes

✅ All endpoints require admin authentication token
✅ Admin can only access doctor information in approval flow
✅ File paths are protected and not directly accessible
✅ Sensitive data is properly filtered before sending to client
✅ All actions are logged for audit purposes

---

## Related Operations

- **Approve doctor**: `PUT /api/doctor-approvals/{id}/approve`
- **Reject doctor**: `PUT /api/doctor-approvals/{id}/reject`
- **Download certificate**: `GET /api/files/{fileId}`
- **Doctor status**: `GET /api/doctor-approvals/status` (doctor endpoint)

---

## Next Steps

1. Implement frontend admin dashboard
2. Add filtering by specialization/date
3. Add bulk operations (approve/reject multiple)
4. Add search functionality
5. Add export/reporting features
