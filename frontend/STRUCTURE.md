# Hospital Management Frontend - Structure Reference

## Quick Start
1. `npm install` - Install dependencies
2. `npm run dev` - Start development server
3. Visit `http://localhost:3000`

## Architecture Overview

### Component Hierarchy
```
App.jsx (Router setup)
├── LandingPage
├── SignInPage
├── SignUpPage
├── ProtectedRoute
│   ├── PatientDashboard
│   └── DoctorDashboard
└── AuthProvider (Context)
```

### Data Flow
```
User Action → Component State (useState)
                    ↓
              API Call (Service)
                    ↓
              API Response/Error
                    ↓
              Update Component State
                    ↓
              Re-render UI
```

### Authentication Flow
```
Sign Up/In
    ↓
API validates credentials
    ↓
Returns JWT + User data
    ↓
Store in localStorage
    ↓
Update AuthContext
    ↓
Redirect to Dashboard
```

## File Organization

### Services (API Layer)
- Each service handles specific domain (auth, appointments, doctors, etc.)
- All use centralized `apiClient` with auto token injection
- Return axios promises

### Pages (UI Layer)
- Full-page components
- Use hooks for local state
- Call services and update UI
- Handle loading/error states

### Components (Reusable)
- Small, focused components
- Accept props for configuration
- Can be used across pages

### Utils (Helpers)
- Pure functions
- No side effects
- Reusable logic (validation, formatting, etc.)

### Context (Global State)
- Auth state accessible everywhere
- Use `useAuth()` hook to access

## Common Patterns

### Fetch Data on Mount
```javascript
useEffect(() => {
  fetchData();
}, []);
```

### Handle Form Submit
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    // API call
  } catch (err) {
    setError(getErrorMessage(err));
  }
};
```

### Use Auth Anywhere
```javascript
const { user, isAuthenticated, logout } = useAuth();
```

### Make API Calls
```javascript
const response = await appointmentService.getAppointments();
```

## Debugging

### Check Token
```javascript
const token = localStorage.getItem('token');
console.log('Token:', token);
```

### Check Auth Context
```javascript
const auth = useAuth();
console.log('User:', auth.user);
console.log('Authenticated:', auth.isAuthenticated);
```

### Network Requests
Use browser DevTools → Network tab to see all API calls

### Console Errors
Browser console shows React and JavaScript errors

## Next Components to Build

### Reusable Components
- `DoctorCard` - Display doctor info
- `AppointmentCard` - Display appointment
- `AppointmentForm` - Book appointment form
- `DoctorSearchFilter` - Filter doctors
- `Modal` - Reusable modal dialog
- `Loading` - Loading spinner
- `Toast` - Notification system

### Hooks to Create
- `useFetch()` - Generic data fetching
- `useForm()` - Form state management
- `useLocalStorage()` - Persistent storage

### Services to Enhance
- Add error recovery
- Implement retry logic
- Add request caching

## Production Checklist

- [ ] Environment variables configured
- [ ] API URLs correct
- [ ] Error boundaries added
- [ ] Loading states implemented
- [ ] Form validation complete
- [ ] HTTPS configured
- [ ] CORS properly set
- [ ] Token refresh implemented
- [ ] Performance optimized
- [ ] Responsive design tested
