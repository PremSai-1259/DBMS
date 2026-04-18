# Hospital Management System - React Frontend

A modern, clean React frontend for a hospital management system built with:
- **React 18** with functional components and hooks
- **React Router v6** for navigation
- **Axios** for API calls with interceptors
- **Vite** for fast build and development
- **JWT** for authentication

## Features

✅ User Authentication (Sign In / Sign Up)  
✅ Role-based Dashboards (Patient & Doctor)  
✅ Protected Routes with JWT  
✅ Appointment Management  
✅ Doctor Search & Filtering  
✅ Schedule Management  
✅ Responsive Design  
✅ Error Handling & Validation  

## Project Structure

```
src/
├── components/           # Reusable React components
│   └── ProtectedRoute.jsx
├── context/             # React Context (Auth state management)
│   └── AuthContext.jsx
├── hooks/               # Custom React hooks
│   └── useAuth.js
├── pages/               # Page components
│   ├── LandingPage.jsx
│   ├── SignInPage.jsx
│   ├── SignUpPage.jsx
│   ├── PatientDashboard.jsx
│   └── DoctorDashboard.jsx
├── services/            # API service layer
│   ├── apiClient.js     # Axios configuration
│   ├── authService.js
│   ├── doctorService.js
│   ├── appointmentService.js
│   ├── slotService.js
│   └── profileService.js
├── styles/              # CSS files
│   ├── index.css
│   ├── App.css
│   └── pages/
├── utils/               # Helper functions
│   ├── helpers.js
│   └── errors.js
├── App.jsx              # Main app component with routing
└── main.jsx             # Entry point
```

## Prerequisites

- Node.js 14+ and npm

## Installation

1. **Clone and navigate to frontend:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
```bash
cp .env.example .env.local
```

Edit `.env.local` and set your API URL:
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Development

**Start the development server:**
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Build

**Build for production:**
```bash
npm run build
```

Output files will be in the `dist/` directory.

**Preview production build:**
```bash
npm run preview
```

## Architecture

### Authentication Flow
1. User signs up/in → API returns JWT token
2. Token stored in localStorage
3. Token added to all API requests via axios interceptor
4. Expired tokens redirect to sign-in page

### State Management
- **Auth Context** manages user state globally
- `useAuth()` hook provides access to auth state anywhere

### API Integration
- Centralized axios instance with automatic token injection
- Error handling with 401 redirect on expired tokens
- Service layer for organized API calls

### Protected Routes
- `ProtectedRoute` component checks authentication
- Role-based access control (patient/doctor)
- Redirect to login if unauthorized

## Key Features

### Login/Signup with JWT
- Email validation
- Password strength requirements (min 8 chars)
- Automatic token storage
- Role selection during signup

### Dashboards
- **Patient**: View appointments, search doctors, manage profile
- **Doctor**: View scheduled appointments, manage schedule, profile

### Doctor Search
- Filter by specialty, availability
- View doctor details and ratings
- Book appointments with available slots

### Appointments
- Book appointment with available slots
- View appointment history
- Manage appointment status

## Code Standards

✅ **React best practices:**
- Functional components only
- Hooks for state & effects
- No direct DOM manipulation
- Proper error handling

✅ **Clean code:**
- Modular components
- Clear naming conventions
- Separated concerns (services, utils, hooks)
- DRY principle

✅ **Performance:**
- Lazy loading ready
- Optimized re-renders
- Efficient state management

## API Endpoints

Ensure your backend is running on `http://localhost:5000/api`

**Auth:**
- POST `/auth/signin` - Login
- POST `/auth/signup` - Register
- POST `/auth/refresh` - Refresh token

**Appointments:**
- GET `/appointments` - List appointments
- POST `/appointments` - Book appointment
- DELETE `/appointments/:id` - Cancel appointment

**Doctors:**
- GET `/doctors` - List all doctors
- GET `/doctors/:id` - Get doctor details
- GET `/doctors/search?q=term` - Search doctors

**Slots:**
- GET `/slots/available` - Get available slots
- GET `/slots/doctor/:id` - Get doctor's slots

## Environment Variables

Create `.env.local`:
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
```

## Troubleshooting

**CORS Error?**
- Check backend CORS configuration
- Verify API URL in `.env.local`

**401 Unauthorized?**
- Token expired - re-login
- Check localStorage for token

**Build errors?**
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear vite cache: `rm -rf dist/.vite`

## Next Steps

- Add more components (DoctorCard, AppointmentForm, etc.)
- Implement doctor search UI
- Add appointment booking form
- Create consultation notes feature
- Add file upload for medical records
- Implement notifications system
- Add doctor approval workflow

## License

MIT
