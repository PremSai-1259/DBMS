# Protected Routes & Security Implementation

## Overview
This document outlines the protected routes implementation with token validation and role-based access control for the hospital management system frontend.

## Architecture

### 1. Token Management
- **Storage**: JWT tokens stored in `localStorage` with key `authToken`
- **Retrieval**: Automatic via axios request interceptor in `api.js`
- **Expiration**: Handled by response interceptor - 401 errors trigger logout and redirect to `/signin`
- **Utility Functions**: `src/utils/tokenUtils.js` provides token decoding and validation

### 2. Authentication Flow
```
User Login
    ↓
authService.login(email, password)
    ↓
API returns {user, token}
    ↓
AuthContext.login(token, user)
    ↓
Redirect to /patient or /doctor
```

### 3. Route Protection Flow
```
Navigate to /patient or /doctor
    ↓
ProtectedRoute Component Checks:
  1. Is user authenticated (has valid token)?
  2. Does localStorage contain authToken?
  3. Does user role match required role?
    ↓
All checks pass → Render component
Checks fail → Redirect appropriately
```

## Components & Files

### ProtectedRoute.jsx
**Purpose**: Guard routes with authentication and role-based access control

**Location**: `src/components/ProtectedRoute.jsx`

**Features**:
- Checks if user is authenticated
- Validates token exists in localStorage
- Verifies user role matches required role
- Case-insensitive role matching
- Shows loading state while auth context initializes
- Redirects unauthorized users appropriately

**Usage**:
```jsx
<Route
  path="/patient"
  element={
    <ProtectedRoute requiredRole="patient">
      <PatientDashboard />
    </ProtectedRoute>
  }
/>
```

**Security Checks**:
1. `auth.loading` → Show loading spinner
2. `!auth.isAuthenticated || !token || !user` → Redirect to `/signin`
3. `userRole !== requiredRole` → Redirect to appropriate dashboard or `/`

### AuthContext.jsx
**Purpose**: Global authentication state management

**Location**: `src/context/AuthContext.jsx`

**Key Methods**:
- `login(token, userData)`: Save token and user to localStorage and state
- `logout()`: Clear all authentication data
- `getToken()`: Retrieve token from localStorage
- `getUser()`: Get current user from state
- `isAuthenticated`: Boolean flag for auth status
- `hasRole(role)`: Check if user has specific role (case-insensitive)

**Token Key**: Uses `'authToken'` for consistency across app

### API Interceptors (api.js)
**Purpose**: Automatic token injection and error handling

**Location**: `src/services/api.js`

**Request Interceptor**:
- Gets token from `localStorage.getItem('authToken')`
- Adds `Authorization: Bearer {token}` header to all requests
- Continues safely if no token found

**Response Interceptor**:
- 401 Error: Clears storage and redirects to `/signin`
- 403 Error: Access forbidden message
- 404 Error: Resource not found
- 500 Error: Server error message
- Network Error: Connection error message

### AuthService
**Purpose**: User authentication operations

**Location**: `src/services/authService.js`

**Key Functions**:
- `login(email, password)`: Authenticate user
- `signup(data)`: Register new user
- `logout()`: Clear session
- `getStoredUser()`: Retrieve user from localStorage

**Token Handling**: Uses `setToken()` from api.js to store tokens consistently

### Token Utilities
**Purpose**: JWT token operations without verification

**Location**: `src/utils/tokenUtils.js`

**Available Functions**:
- `decodeToken(token)`: Decode JWT payload
- `getRoleFromToken(token)`: Extract role from token
- `getUserIdFromToken(token)`: Extract user ID
- `isTokenExpired(token)`: Check if token expired
- `getEmailFromToken(token)`: Extract email
- `isValidTokenFormat(token)`: Validate token format
- `getTokenData(token)`: Get all token data

**Note**: These functions only decode tokens - they do NOT verify signatures. Backend must verify tokens.

## Route Configuration

### App.jsx Routes
**Location**: `src/App.jsx`

**Public Routes**:
- `/` → LandingPage
- `/signin` → SignInPage
- `/signup` → SignUpPage

**Protected Routes - Patient**:
- `/patient` → PatientDashboard (requires role: 'patient')
- `/patient-dashboard` → PatientDashboard (alias, requires role: 'patient')

**Protected Routes - Doctor**:
- `/doctor` → DoctorDashboard (requires role: 'doctor')
- `/doctor-dashboard` → DoctorDashboard (alias, requires role: 'doctor')

**Catch-all**:
- `*` → Redirect to `/`

## Security Flow

### Initial Load
1. App mounts → AuthProvider initializes
2. AuthProvider checks localStorage for `authToken` and `user`
3. If found, restores session (sets user in state)
4. Sets `loading = false`
5. User can now navigate

### Accessing Protected Route
1. User navigates to `/patient` or `/doctor`
2. ProtectedRoute checks:
   - Is `auth.loading` true? → Show spinner
   - Is `auth.isAuthenticated` true? → Check token exists
   - Does `userRole` match `requiredRole`? → Check role match
3. All checks pass → Render protected component
4. Any check fails → Redirect to appropriate route

### Token Expiration
1. User makes API request
2. Response interceptor gets 401 status
3. localStorage.removeItem('authToken') and ('user')
4. window.location.href = '/signin'
5. User redirected to login page

### Role Mismatch
1. Patient tries to access `/doctor`
2. ProtectedRoute detects role mismatch
3. Redirects to `/patient` (patient's dashboard)
4. Doctor tries to access `/patient`
5. ProtectedRoute redirects to `/doctor`

## localStorage Keys
- `authToken`: JWT authentication token
- `user`: Stringified user object with {id, email, role, firstName, lastName, etc.}

## Testing Scenarios

### Test 1: Direct Access Without Login
1. Open browser DevTools → Application → localStorage
2. Delete `authToken` and `user`
3. Navigate to `http://localhost:3000/patient`
4. Expected: Redirect to `/signin`

### Test 2: Role Mismatch
1. Login as patient
2. Try to access `/doctor` directly
3. Expected: Redirect to `/patient`

### Test 3: Token Expiration
1. Login successfully
2. Wait for backend to invalidate token OR manually delete from localStorage
3. Make API call from PatientDashboard
4. Expected: 401 response → Redirect to `/signin`

### Test 4: Valid Access
1. Login as patient with correct credentials
2. Navigate to `/patient`
3. Expected: PatientDashboard renders successfully
4. All appointments and doctor data loads

## Configuration

### Environment Variables
- `REACT_APP_API_URL`: Backend API base URL (default: `http://localhost:5000/api`)

### localStorage Keys (Configurable)
Current: `authToken` and `user`
To change: Update keys in:
- AuthContext.jsx
- api.js
- ProtectedRoute.jsx

### Token Expiration Handling
Current: Automatic redirect on 401
To customize: Modify response interceptor in `api.js`

## Common Issues & Solutions

### Issue: Blank page after login
**Cause**: Token not being stored or AuthContext not initialized
**Solution**: Check browser console for errors, verify `authToken` exists in localStorage

### Issue: Infinite redirect loop
**Cause**: ProtectedRoute redirecting to same route or incorrect role logic
**Solution**: Verify role values in localStorage match expected values ('patient' or 'doctor')

### Issue: API requests failing with 401
**Cause**: Token expired or request interceptor not adding token
**Solution**: Check if `authToken` exists in localStorage, verify Authorization header is being sent

### Issue: Lost session on page refresh
**Cause**: AuthContext not restoring session from localStorage
**Solution**: Verify AuthProvider useEffect is running and localStorage keys are correct

## Best Practices

1. **Never Trust Client-Side Validation**: Backend must verify all tokens and permissions
2. **Secure Token Storage**: localStorage is accessible to XSS attacks. Consider httpOnly cookies for future enhancement
3. **HTTPS Only**: Always use HTTPS in production to prevent token interception
4. **Token Rotation**: Implement refresh tokens for enhanced security
5. **Logout on Tab Close**: Consider clearing tokens when browser tab closes
6. **Audit Logging**: Log all authentication events for security monitoring

## Future Enhancements

1. **Refresh Token Implementation**: Add automatic token refresh before expiration
2. **httpOnly Cookies**: Move tokens to httpOnly cookies for better security
3. **CSRF Protection**: Implement CSRF tokens for state-changing operations
4. **Session Timeout**: Automatically logout user after inactivity period
5. **Multi-factor Authentication**: Add 2FA for enhanced security
6. **Device Fingerprinting**: Detect suspicious login locations
7. **Audit Trail**: Log all sensitive operations

## Debugging

### Enable Debug Logging
Add to ProtectedRoute.jsx:
```javascript
console.log('ProtectedRoute Debug:', {
  loading: auth.loading,
  isAuthenticated: auth.isAuthenticated,
  tokenExists: !!token,
  userExists: !!user,
  userRole: userData?.role,
  requiredRole,
})
```

### Check Token in DevTools
```javascript
// In browser console:
console.log(localStorage.getItem('authToken'))
console.log(JSON.parse(localStorage.getItem('user')))
```

### Decode Token Manually
```javascript
// In browser console:
import { decodeToken } from './utils/tokenUtils.js'
const token = localStorage.getItem('authToken')
console.log(decodeToken(token))
```
