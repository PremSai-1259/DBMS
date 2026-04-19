# Test doctor approval end-to-end flow
$API_BASE = "http://localhost:5000/api"
$uniqueEmail = "testdoc-$(Get-Random)-$(Get-Date -Format 'yyyyMMddHHmmss')@hospital.com"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "STEP 1: Register new doctor" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan

$signupBody = @{
    name = "Test Doctor"
    email = $uniqueEmail
    password = "TempPass123!"
    role = "doctor"
} | ConvertTo-Json

try {
    $signupRes = Invoke-WebRequest -Uri "$API_BASE/auth/signup" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $signupBody -ErrorAction Stop
    $signupJson = $signupRes.Content | ConvertFrom-Json
    $doctorId = $signupJson.user.id
    Write-Host "✅ Doctor registered with ID: $doctorId, Email: $uniqueEmail" -ForegroundColor Green
} catch {
    Write-Host "❌ Signup failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n======================================================================" -ForegroundColor Cyan
Write-Host "STEP 2: Login to get JWT token" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan

$loginBody = @{
    email = $uniqueEmail
    password = "TempPass123!"
} | ConvertTo-Json

try {
    $loginRes = Invoke-WebRequest -Uri "$API_BASE/auth/login" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $loginBody -ErrorAction Stop
    $loginJson = $loginRes.Content | ConvertFrom-Json
    $token = $loginJson.token
    Write-Host "✅ Token received" -ForegroundColor Green
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n======================================================================" -ForegroundColor Cyan
Write-Host "STEP 3: Create doctor profile" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan

$profileBody = @{
    specialization = "Cardiology"
    experience = 15
    hospital_name = "City General Hospital"
    address = "123 Medical Street, Health City, HC 12345"
} | ConvertTo-Json

try {
    $profileRes = Invoke-WebRequest -Uri "$API_BASE/profile/doctor" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $token"
        } `
        -Body $profileBody -ErrorAction Stop
    $profileJson = $profileRes.Content | ConvertFrom-Json
    $profileId = $profileJson.profile.id
    Write-Host "✅ Profile created with ID: $profileId" -ForegroundColor Green
} catch {
    Write-Host "❌ Profile creation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n======================================================================" -ForegroundColor Cyan
Write-Host "STEP 4: Upload certificate file" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan

# Create test certificate file
$testCertPath = "$PSScriptRoot\test-cert.txt"
"Test Certificate - $(Get-Date)" | Out-File $testCertPath

try {
    $fileStream = [System.IO.File]::OpenRead($testCertPath)
    $uploadRes = Invoke-WebRequest -Uri "$API_BASE/files/upload" `
        -Method POST `
        -Headers @{"Authorization" = "Bearer $token"} `
        -Form @{
            file = $fileStream
            fileType = "certificate"
        } -ErrorAction Stop
    $uploadJson = $uploadRes.Content | ConvertFrom-Json
    $certificateFileId = $uploadJson.file.id
    Write-Host "✅ Certificate uploaded with ID: $certificateFileId" -ForegroundColor Green
    $fileStream.Close()
} catch {
    Write-Host "❌ Upload failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Cleanup
Remove-Item $testCertPath -Force

Write-Host "`n======================================================================" -ForegroundColor Cyan
Write-Host "STEP 5: Request doctor approval (THIS IS WHERE THE ERROR OCCURS)" -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan

$approvalBody = @{
    certificateFileId = $certificateFileId
} | ConvertTo-Json

Write-Host "Sending approval request..."
Write-Host "  Doctor ID: $doctorId"
Write-Host "  Certificate File ID: $certificateFileId"
Write-Host ""

try {
    $approvalRes = Invoke-WebRequest -Uri "$API_BASE/doctor-approvals/request" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $token"
        } `
        -Body $approvalBody -ErrorAction Stop
    
    Write-Host "HTTP Status Code: $($approvalRes.StatusCode)" -ForegroundColor Green
    Write-Host "Response Body:" -ForegroundColor Green
    $approvalJson = $approvalRes.Content | ConvertFrom-Json
    Write-Host ($approvalJson | ConvertTo-Json -Depth 10)
    Write-Host "`n✅ Approval request SUCCEEDED" -ForegroundColor Green
    
} catch {
    Write-Host "HTTP Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Response Body:" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorResponse = $reader.ReadToEnd()
        $reader.Close()
        Write-Host $errorResponse -ForegroundColor Red
    } else {
        Write-Host $($_.Exception.Message) -ForegroundColor Red
    }
    Write-Host "`n❌ Approval request FAILED" -ForegroundColor Red
}

Write-Host "`n======================================================================" -ForegroundColor Cyan
Write-Host "TEST COMPLETED" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
