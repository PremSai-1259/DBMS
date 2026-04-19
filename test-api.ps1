# Test login and get pending approvals
$baseUrl = "http://localhost:5000"

# Login
Write-Host "1. Testing login endpoint..."
$loginBody = @{
    email = "admin@healthcare.com"
    password = "admin@123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody
    
    Write-Host "✅ Login successful"
    Write-Host "Response: $($loginResponse | ConvertTo-Json)"
    
    $token = $loginResponse.token
    Write-Host "`nToken: $token"
    
    # Test pending approvals
    Write-Host "`n2. Testing pending doctor approvals endpoint..."
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $approvalsResponse = Invoke-RestMethod -Uri "$baseUrl/api/doctor-approvals/pending" `
        -Method GET `
        -Headers $headers
    
    Write-Host "✅ Pending approvals endpoint successful"
    Write-Host "Response: $($approvalsResponse | ConvertTo-Json -Depth 5)"
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)"
    Write-Host "Full error: $_"
}
