# Test booking
$slotId = 39
$doctorId = 38

$loginResp = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -Headers @{'Content-Type' = 'application/json'} `
  -Body (ConvertTo-Json @{email = "hi12@gmail.com"; password = "123"})

$token = $loginResp.token
Write-Host "Token: $($token.Substring(0, 20))..."

try {
  $bookResp = Invoke-RestMethod -Uri "http://localhost:5000/api/appointments/book" `
    -Method POST `
    -Headers @{
      'Content-Type' = 'application/json'
      'Authorization' = "Bearer $token"
    } `
    -Body (ConvertTo-Json @{doctorId = $doctorId; slotId = $slotId})
  
  Write-Host "Success: $bookResp"
} catch {
  Write-Host "Error: $($_.Exception.Message)"
  $errorBody = $_.Exception.Response.Content
  Write-Host "Response: $errorBody"
}
