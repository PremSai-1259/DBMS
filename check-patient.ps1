# Check patient user credentials
$checkResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/test/check-user" `
  -Method POST `
  -Headers @{'Content-Type' = 'application/json'} `
  -Body (@{email = 'hi12@gmail.com'} | ConvertTo-Json) `
  -ErrorAction SilentlyContinue

Write-Host "Response:" $checkResponse.Content
