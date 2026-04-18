# Test script to verify files API works end-to-end

Write-Host "=== Testing Hospital Management Files API ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login
Write-Host "Step 1: Logging in..." -ForegroundColor Yellow
$loginBody = @{
    email = "anithareddy11@gmail.com"
    password = "password123"
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri http://localhost:5000/api/auth/login `
    -Method Post `
    -ContentType "application/json" `
    -Body $loginBody `
    -UseBasicParsing

$loginData = $loginResponse.Content | ConvertFrom-Json
$token = $loginData.token
$user = $loginData.user

Write-Host "✓ Login successful" -ForegroundColor Green
Write-Host "  - User ID: $($user.id)" 
Write-Host "  - Email: $($user.email)"
Write-Host "  - Token received: $(if ($token) { 'Yes' } else { 'No' })"
Write-Host ""

# Step 2: Get files
Write-Host "Step 2: Fetching files..." -ForegroundColor Yellow
$filesResponse = Invoke-WebRequest -Uri http://localhost:5000/api/files `
    -Method Get `
    -Headers @{"Authorization"="Bearer $token"} `
    -UseBasicParsing

$filesData = $filesResponse.Content | ConvertFrom-Json

Write-Host "✓ Files fetched" -ForegroundColor Green
Write-Host "  - Message: $($filesData.message)"
Write-Host "  - Total files: $($filesData.files.Count)"
Write-Host ""

# Step 3: Display files
if ($filesData.files.Count -gt 0) {
    Write-Host "Step 3: File Details" -ForegroundColor Yellow
    foreach ($file in $filesData.files) {
        Write-Host "  • $($file.file_name)" -ForegroundColor Cyan
        Write-Host "    - ID: $($file.id)"
        Write-Host "    - Type: $($file.file_type)"
        Write-Host "    - Uploaded: $($file.uploaded_at)"
    }
} else {
    Write-Host "No files found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Response Format Check ===" -ForegroundColor Yellow
$filesData | ConvertTo-Json -Depth 3 | Write-Host
