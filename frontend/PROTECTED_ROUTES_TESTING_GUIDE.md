# Protected Routes - Quick Start & Testing Guide

## Setup & Running

### 1. Start Backend (if not already running)
```bash
cd backend
npm install
npm start
# Expected: Server running on http://localhost:5000
```

### 2. Start Frontend Dev Server
```bash
cd frontend
npm install
npm run dev
# Expected: Server running on http://localhost:3000
```

### 3. Open Application
```
http://localhost:3000
```

## Testing Checklist

### ✅ Test 1: Unauthenticated Access (No Token)
**Steps**:
1. Open DevTools (F12)
2. Go to Application → Storage → localStorage
3. Delete `authToken` and `user` entries if they exist
4. Navigate to `http://localhost:3000/patient`
5. **Expected Result**: Redirected to `/signin` page

**What's Happening**:
- ProtectedRoute checks if token exists
- No token found → redirect to /signin

---

### ✅ Test 2: Successful Patient Login
**Steps**:
1. Go to `http://localhost:3000/signin`
2. Make sure "Patient" role is selected
3. Enter patient email and password
4. Click "Sign In"
5. **Expected Result**: Redirected to `/patient`, PatientDashboard displays

**What's Happening**:
- SignInPage validates credentials
- AuthService.login() makes API call
- Token stored in localStorage with key `authToken`
- AuthContext.login() saves user to state and localStorage
- ProtectedRoute checks all conditions and allows access

---

### ✅ Test 3: Successful Doctor Login
**Steps**:
1. Go to `http://localhost:3000/signin`
2. Change to "Doctor" role
3. Enter doctor email and password
4. Click "Sign In"
5. **Expected Result**: Redirected to `/doctor`, DoctorDashboard displays

**What's Happening**:
- Same as Test 2 but with doctor credentials
- Redirects to `/doctor` instead of `/patient`

---

### ✅ Test 4: Role Mismatch Detection
**Steps**:
1. Login as Patient
2. Manually navigate to `http://localhost:3000/doctor`
3. **Expected Result**: Redirected back to `/patient`

**What's Happening**:
- ProtectedRoute checks user role
- User role is 'patient', route requires 'doctor'
- Role mismatch detected → redirect to user's actual dashboard

---

### ✅ Test 5: Doctor Cannot Access Patient Dashboard
**Steps**:
1. Login as Doctor
2. Manually navigate to `http://localhost:3000/patient`
3. **Expected Result**: Redirected to `/doctor`

**What's Happening**:
- Same as Test 4, but opposite direction
- Doctor role doesn't match 'patient' requirement

---

### ✅ Test 6: Token Persistence on Page Refresh
**Steps**:
1. Login as Patient
2. Press F5 to refresh the page
3. **Expected Result**: Session restored, PatientDashboard still visible

**What's Happening**:
- AuthProvider checks localStorage on mount
- Finds `authToken` and `user` entries
- Restores session without requiring new login

---

### ✅ Test 7: Logout Clears Session
**Steps**:
1. Login as Patient (already logged in from previous tests)
2. Click "Logout" button (if available in UI)
3. Check DevTools localStorage
4. **Expected Result**: `authToken` and `user` cleared

**What's Happening**:
- AuthContext.logout() called
- localStorage entries removed
- User redirected to home or signin

---

### ✅ Test 8: Token Expiration Handling
**Steps**:
1. Login as Patient
2. Open DevTools → Application → localStorage
3. Delete the `authToken` entry (simulating expired token)
4. Try to make an action that triggers API call (e.g., search for doctors)
5. **Expected Result**: 401 error → redirect to `/signin`

**What's Happening**:
- API interceptor doesn't find token
- API call goes through but backend rejects (401)
- Response interceptor catches 401
- localStorage cleared
- User redirected to /signin

---

### ✅ Test 9: Route Aliases Work
**Steps**:
1. Login as Patient
2. Navigate to `/patient-dashboard`
3. **Expected Result**: Same as `/patient`, works identically

**What's Happening**:
- Both `/patient` and `/patient-dashboard` point to same component
- Both have same role protection

---

### ✅ Test 10: API Requests Include Token
**Steps**:
1. Login as Patient
2. Open DevTools → Network tab
3. Trigger an API call (e.g., search doctors)
4. Click on the request in Network tab
5. Check "Request Headers"
6. **Expected Result**: `Authorization: Bearer {token}` header present

**What's Happening**:
- Request interceptor in api.js runs before every request
- Automatically adds Authorization header with token from localStorage

---

## Debugging

### View Current Auth State
Open DevTools Console and run:
```javascript
// See stored token
console.log('Token:', localStorage.getItem('authToken'))

// See stored user
console.log('User:', JSON.parse(localStorage.getItem('user')))
```

### Decode JWT Token
Run in console:
```javascript
// Paste this to decode JWT
const decodeToken = (token) => {
  const parts = token.split('.')
  const payload = parts[1]
  const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
  return JSON.parse(decoded)
}

const token = localStorage.getItem('authToken')
console.log('Decoded Token:', decodeToken(token))
```

### Check API Base URL
Open DevTools Console:
```javascript
// Should show http://localhost:5000/api
console.log('API Base URL:', 'http://localhost:5000/api')
```

### Enable Detailed Logging
Add to ProtectedRoute.jsx temporarily:
```javascript
console.log('ProtectedRoute Check:', {
  loading: auth.loading,
  isAuthenticated: auth.isAuthenticated,
  token: !!token,
  user: !!user,
  userRole: userData?.role,
  requiredRole: requiredRole,
  roleMatch: userData?.role?.toLowerCase() === requiredRole?.toLowerCase()
})
```

## Common Test Failures & Fixes

### ❌ "Blank page with loading spinner that never stops"
**Possible Causes**:
- Backend not running
- API requests hanging

**Fix**:
- Check backend is running: `http://localhost:5000/api`
- Check browser console for error messages
- Restart backend server

---

### ❌ "Redirects to /signin even after login"
**Possible Causes**:
- Token not being saved to localStorage
- AuthContext not initialized

**Fix**:
- Check DevTools localStorage for `authToken` entry
- Look for console errors in DevTools
- Verify login API endpoint is correct

---

### ❌ "Cannot access /patient even after patient login"
**Possible Causes**:
- User role mismatch
- Token not being recognized

**Fix**:
- Check user role in localStorage: `JSON.parse(localStorage.getItem('user')).role`
- Should be exactly 'patient' (lowercase)
- Check if login selected patient role

---

### ❌ "API calls fail with 401 after few minutes"
**Possible Causes**:
- Token expired on backend
- Session timeout

**Fix**:
- Backend needs to set longer expiration time
- Or implement refresh token mechanism
- For now, just login again

---

## Testing Credentials

Use existing test accounts from your backend setup:

### Patient Account
- Email: `patient@example.com`
- Password: `password123`

### Doctor Account
- Email: `doctor@example.com`
- Password: `password123`

(Replace with your actual test credentials)

## Performance Notes

- **Initial Load**: AuthProvider checks localStorage (< 1ms)
- **ProtectedRoute Check**: < 1ms (all checks are synchronous)
- **API Intercept**: < 1ms (token injection is synchronous)
- **Loading State**: Shows spinner for 0-500ms while auth initializes

## Security Notes

✅ **Implemented**:
- Token stored in localStorage
- Automatic token injection in requests
- Automatic logout on 401
- Role-based access control
- Route protection

⚠️ **Not Implemented Yet** (Future):
- Refresh token mechanism
- CSRF protection
- httpOnly cookies
- XSS protection
- Session timeout

## Next Steps

After testing passes:
1. Move token storage to httpOnly cookies (more secure)
2. Implement refresh token mechanism
3. Add CSRF protection
4. Add session timeout
5. Implement rate limiting

## Support

If tests fail:
1. Check browser console for errors
2. Check backend console for API errors
3. Verify network requests in DevTools Network tab
4. Check localStorage values in DevTools
5. Review implementation docs: PROTECTED_ROUTES_IMPLEMENTATION.md
