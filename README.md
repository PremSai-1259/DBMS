# Patient Centric Data Governance and Appointment Platform

## 1. Basic Info

**Project Name:** Patient Centric Data Governance and Appointment Platform

**Short Description:**
A healthcare management system for patients, doctors, and admins to handle sign-in, profile setup, doctor approval, appointment booking, medical file uploads, consultation notes, and controlled medical record access.

## 2. Purpose

This project solves the common problem of fragmented hospital workflows by bringing patient profiles, doctor onboarding, appointment scheduling, file management, and admin review into one system.

It is designed for:

- Patients who want to find doctors, book appointments, and upload medical reports
- Doctors who manage schedules, appointments, and consultation notes
- Admins who review doctor profiles, certificates, and approval requests

## 3. Features

### Core Features

- User authentication with role-based access for patient, doctor, and admin accounts
- Role-based dashboard routing after login
- Doctor search by condition, symptom, or specialization
- Appointment booking with available slots
- Appointment history with upcoming and past visits
- Appointment cancellation with reason tracking
- Patient profile creation and update
- Medical file upload, list, preview, and delete
- Doctor profile setup with certificate upload workflow
- Doctor approval and rejection flow for admins
- Consultation notes for completed appointments
- Controlled medical record access requests
- Notifications and review support

### Role-Based Features

**Patient**
- Search doctors and view available slots
- Book appointments
- View upcoming and past appointments
- Upload medical reports
- Manage patient profile

**Doctor**
- Manage schedule and available slots
- View patient appointments
- Add or update consultation notes
- Cancel appointments with reason
- Access approved patient records

**Admin**
- Review doctor applications
- View uploaded certificates and doctor profile details
- Approve or reject requests
- Download submitted documents

## 4. Tech Stack

### Frontend

- React 18
- Vite
- React Router
- Axios
- Tailwind CSS

### Backend

- Node.js
- Express.js
- JWT authentication
- Multer for file uploads
- Nodemailer for email-related features

### Database

- MySQL

### Other Tools

- dotenv for environment variables
- bcrypt for password hashing
- CORS for API access

## 5. Database Design

### Main Tables

- `users` - stores login identity and role
- `doctor_profiles` - stores doctor specialization, experience, hospital, and verification data
- `patient_profiles` - stores patient age, gender, phone, and blood group
- `doctor_approvals` - stores doctor certificate approval workflow
- `files` - stores uploaded certificates, reports, and profile images
- `doctor_schedules` - stores doctor availability by date
- `appointment_slots` - stores individual slots and availability
- `appointments` - stores bookings between patients and doctors
- `consultation_notes` - stores diagnosis and prescription details
- `record_access` - stores patient record access requests


### Relationships

- One `user` can have one `doctor_profile` or one `patient_profile`
- One `user` can upload many `files`
- One `doctor_profile` can have many approval attempts through `doctor_approvals`
- One `doctor` can create many `appointment_slots`
- One `appointment` belongs to one patient, one doctor, and one slot
- One `appointment` can have one `consultation_notes` record


## 6. Installation Steps

### Prerequisites

- Node.js installed
- MySQL installed and running
- A database created for the project

### Backend Setup

1. Open the backend folder.
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the backend folder with values like:

```env
PORT=5001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=your_database_name
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_email_app_password
```

4. Start the backend server:

```bash
npm start
```

### Frontend Setup

1. Open the frontend folder.
2. Install dependencies:

```bash
npm install
```

3. If needed, create a `.env` file for production API config:

```env
VITE_API_URL=http://localhost:5001/api
```

4. Start the frontend development server:

```bash
npm run dev
```

### Local Development URLs

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5001`

## 7. Screenshots

Add screenshots here later. Suggested sections:

- Login page
- Patient dashboard
- Doctor dashboard
- Admin dashboard
- Appointment booking modal
- File upload section

Example format:

```md
![Login Page](screenshots/login-page.png)
![Patient Dashboard](screenshots/patient-dashboard.png)
![Booking Page](screenshots/booking-page.png)
```

## 8. Folder Structure

```text
DBMS/
├── backend/
│   ├── configs/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── index.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── services/
│   └── vite.config.js
├── backend/configs/schema.sql
└── documentation and setup guides
```

## 9. Future Improvements

- AI-powered doctor recommendations
- Push and SMS notifications
- Mobile app version
- Online payment integration
- Automated reminders for appointments and medication

## Summary

This project provides a complete role-based healthcare workflow for patients, doctors, and admins. It combines authentication, appointment management, file upload, doctor approvals, scheduling, and consultation tracking into one centralized platform.
