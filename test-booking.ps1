# Test booking endpoint

# Patient login first to get token
$loginResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -Headers @{'Content-Type' = 'application/json'} `
  -Body (@{email = 'hi12@gmail.com'; password = '123'} | ConvertTo-Json)

$loginData = $loginResponse.Content | ConvertFrom-Json
$token = $loginData.token
Write-Host "✅ Login successful. Token: $($token.substring(0, 20))..."

# Test booking
$bookingResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/appointments/book" `
  -Method POST `
  -Headers @{'Content-Type' = 'application/json'; 'Authorization' = "Bearer $token"} `
  -Body (@{doctorId = 38; slotId = 39} | ConvertTo-Json) `
  -ErrorAction SilentlyContinue

if ($bookingResponse.StatusCode -eq 201) {
  $bookingData = $bookingResponse.Content | ConvertFrom-Json
  Write-Host "✅ Booking successful!"
  Write-Host "Response:" ($bookingData | ConvertTo-Json -Depth 3)
} else {
  Write-Host "❌ Booking failed with status $($bookingResponse.StatusCode)"
  Write-Host "Response:" $bookingResponse.Content
}
