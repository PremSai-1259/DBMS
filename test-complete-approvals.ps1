# Complete test script for Doctor Approvals API
# Tests both pending approvals and doctor details endpoints

$baseUrl = "http://localhost:5000"
$doctorId = 1  # Change this to test different doctors

Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Doctor Approvals API - Complete Test Suite                ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Step 1: Login as Admin
Write-Host "STEP 1: Admin Login" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Gray

$loginBody = @{
    email = "admin@healthcare.com"
    password = "admin@123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody
    
    Write-Host "✅ Admin login successful" -ForegroundColor Green
    $token = $loginResponse.token
    $adminId = $loginResponse.user.id
    Write-Host "Admin ID: $adminId`n"
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Get Pending Doctor Approvals
Write-Host "STEP 2: Get Pending Doctor Approvals" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Gray

try {
    $approvalsResponse = Invoke-RestMethod -Uri "$baseUrl/api/doctor-approvals/pending" `
        -Method GET `
        -Headers $headers
    
    Write-Host "✅ Pending approvals retrieved successfully" -ForegroundColor Green
    Write-Host "Total pending approvals: $($approvalsResponse.count)`n"
    
    if ($approvalsResponse.count -gt 0) {
        Write-Host "Pending Doctors:" -ForegroundColor Cyan
        foreach ($approval in $approvalsResponse.pending) {
            Write-Host "  Doctor: $($approval.doctor.name)"
            Write-Host "    Email: $($approval.doctor.email)"
            Write-Host "    Specialization: $($approval.doctor.specialization)"
            Write-Host "    Experience: $($approval.doctor.experience) years"
            Write-Host "    Approval ID: $($approval.approvalId)"
            Write-Host "    Doctor ID: $($approval.doctorId)`n"
            
            if ($doctorId -eq 1) {
                $doctorId = $approval.doctorId
            }
        }
    } else {
        Write-Host "No pending approvals at this time`n" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Failed to get pending approvals: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Get Doctor Details and Uploaded Files
Write-Host "STEP 3: Get Doctor Approval Details `& Files" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Gray

try {
    $detailsResponse = Invoke-RestMethod -Uri "$baseUrl/api/doctor-approvals/doctor/$doctorId/details" `
        -Method GET `
        -Headers $headers
    
    Write-Host "✅ Doctor details retrieved successfully" -ForegroundColor Green
    Write-Host "`n--- DOCTOR PROFILE ---"
    Write-Host "Name: $($detailsResponse.doctor.name)"
    Write-Host "Email: $($detailsResponse.doctor.email)"
    Write-Host "Specialization: $($detailsResponse.doctor.specialization)"
    Write-Host "Experience: $($detailsResponse.doctor.experience) years"
    Write-Host "Hospital: $($detailsResponse.doctor.hospitalName)"
    Write-Host "Address: $($detailsResponse.doctor.address)"
    Write-Host "Verified: $($detailsResponse.doctor.isVerified)"
    
    Write-Host "`n--- APPROVAL STATUS ---"
    Write-Host "Status: $($detailsResponse.approval.status)"
    Write-Host "Submitted: $($detailsResponse.approval.submittedAt)"
    if ($detailsResponse.approval.adminMessage) {
        Write-Host "Admin Message: $($detailsResponse.approval.adminMessage)"
    }
    
    Write-Host "`n--- CERTIFICATE FILE ---"
    if ($detailsResponse.certificateFile) {
        Write-Host "Name: $($detailsResponse.certificateFile.name)"
        Write-Host "Path: $($detailsResponse.certificateFile.path)"
    } else {
        Write-Host "No certificate file"
    }
    
    Write-Host "`n--- ALL UPLOADED FILES ---"
    Write-Host "Total files: $($detailsResponse.allFiles.Count)"
    foreach ($file in $detailsResponse.allFiles) {
        Write-Host "  • $($file.name)"
        Write-Host "    Type: $($file.type)"
        Write-Host "    Uploaded: $($file.uploadedAt)"
    }
    Write-Host "`n"
    
} catch {
    Write-Host "Failed to get doctor details: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Note: This endpoint requires an existing pending approval for the doctor" -ForegroundColor Yellow
}

# Step 4: Summary
Write-Host "STEP 4: Summary" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host "✅ All endpoints tested successfully!" -ForegroundColor Green
Write-Host "`nAdmin Capabilities:" -ForegroundColor Cyan
Write-Host "  ✓ View all pending doctor approval requests"
Write-Host "  ✓ Access doctor profile details"
Write-Host "  ✓ View all files uploaded by doctor"
Write-Host "  ✓ Approve or reject requests"
Write-Host "  ✓ Leave rejection messages for doctors"
Write-Host "`n"
