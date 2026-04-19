@echo off
REM First, login and get token
for /f "tokens=*" %%a in ('curl -s -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"abcdefg@gmail.com\",\"password\":\"password123\"}" ^
  ^| findstr /R "token"') do set TOKEN=%%a

echo Login response: %TOKEN%

REM Extract token value (this is a simple approach, might need refinement)
for /f "delims=: tokens=2" %%a in ('echo %TOKEN%') do set EXTRACTED_TOKEN=%%a

echo Getting access requests...

curl -X GET http://localhost:5000/api/access/requests ^
  -H "Authorization: Bearer %EXTRACTED_TOKEN%" ^
  -H "Content-Type: application/json"

echo.
echo Done
