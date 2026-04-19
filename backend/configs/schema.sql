

-- ==============================
-- USERS (MAIN IDENTITY)
-- ==============================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('patient','doctor','admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================
-- FILES (ALL UPLOADS) ✅ MUST COME EARLY
-- ==============================
CREATE TABLE files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,

    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,

    file_type ENUM('certificate','medical_report','profile_image') NOT NULL,

    hash_value VARCHAR(255),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==============================
-- DOCTOR PROFILES
-- ==============================
CREATE TABLE doctor_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,

    specialization VARCHAR(100) NOT NULL,
    experience INT NOT NULL,
    hospital_name VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL,

    is_verified BOOLEAN DEFAULT FALSE,
    average_rating FLOAT DEFAULT 0,

    profile_image_id INT,
    certificate_file_id INT,   -- public certificate

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (profile_image_id) REFERENCES files(id) ON DELETE SET NULL,
    FOREIGN KEY (certificate_file_id) REFERENCES files(id) ON DELETE SET NULL,
    
    -- ✅ CONSTRAINTS: Prevent invalid data
    CHECK (experience >= 0 AND experience <= 70),
    CHECK (LENGTH(specialization) >= 3),
    CHECK (LENGTH(hospital_name) >= 2),
    CHECK (LENGTH(address) >= 10)
);

-- ==============================
-- PATIENT PROFILES
-- ==============================
CREATE TABLE patient_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,

    age INT,
    gender VARCHAR(10),
    phone VARCHAR(15),
    blood_group ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-'),

    profile_image_id INT,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (profile_image_id) REFERENCES files(id) ON DELETE SET NULL
);

-- ==============================
-- DOCTOR APPROVALS
-- ==============================
-- Note: doctor_id has a NON-UNIQUE index (allows multiple approval records per doctor)
-- This enables doctors to resubmit after rejection
-- hasPendingApproval() check ensures only 1 pending request at a time
CREATE TABLE doctor_approvals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT,
    certificate_file_id INT,

    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    admin_message TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,

    INDEX idx_doctor_status (doctor_id, status),
    INDEX idx_status (status),
    INDEX idx_doctor_id (doctor_id),

    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (certificate_file_id) REFERENCES files(id) ON DELETE CASCADE
);

-- ==============================
-- DOCTOR SCHEDULES (24 SLOTS PER DAY)
-- ==============================
-- Stores doctor's availability for specific dates
-- 24 slots: 8:00 AM - 9:00 PM (30 min each), break 12:00 PM - 1:00 PM (slots 9-10 skipped)
-- Slot mapping: 1-8 (8am-12pm), 11-24 (1pm-9pm)
CREATE TABLE doctor_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    schedule_date DATE NOT NULL,

    slot_1 BOOLEAN DEFAULT FALSE,
    slot_2 BOOLEAN DEFAULT FALSE,
    slot_3 BOOLEAN DEFAULT FALSE,
    slot_4 BOOLEAN DEFAULT FALSE,
    slot_5 BOOLEAN DEFAULT FALSE,
    slot_6 BOOLEAN DEFAULT FALSE,
    slot_7 BOOLEAN DEFAULT FALSE,
    slot_8 BOOLEAN DEFAULT FALSE,
    slot_11 BOOLEAN DEFAULT FALSE,
    slot_12 BOOLEAN DEFAULT FALSE,
    slot_13 BOOLEAN DEFAULT FALSE,
    slot_14 BOOLEAN DEFAULT FALSE,
    slot_15 BOOLEAN DEFAULT FALSE,
    slot_16 BOOLEAN DEFAULT FALSE,
    slot_17 BOOLEAN DEFAULT FALSE,
    slot_18 BOOLEAN DEFAULT FALSE,
    slot_19 BOOLEAN DEFAULT FALSE,
    slot_20 BOOLEAN DEFAULT FALSE,
    slot_21 BOOLEAN DEFAULT FALSE,
    slot_22 BOOLEAN DEFAULT FALSE,
    slot_23 BOOLEAN DEFAULT FALSE,
    slot_24 BOOLEAN DEFAULT FALSE,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE (doctor_id, schedule_date),
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_doctor_date (doctor_id, schedule_date)
);

-- ==============================
-- APPOINTMENT SLOTS (1–24)
-- ==============================
CREATE TABLE appointment_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT,
    slot_date DATE,

    slot_number INT CHECK (slot_number BETWEEN 1 AND 24),
    slot_start_time TIME,
    slot_end_time TIME,

    is_available BOOLEAN DEFAULT FALSE,
    is_booked BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE (doctor_id, slot_date, slot_number),
    INDEX idx_doctor_date (doctor_id, slot_date),
    INDEX idx_doctor_available (doctor_id, is_available),

    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==============================
-- APPOINTMENTS
-- ==============================
CREATE TABLE appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT,
    doctor_id INT,
    slot_id INT,

    status ENUM('pending','confirmed','completed','cancelled') DEFAULT 'confirmed',
    cancel_reason TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (slot_id) REFERENCES appointment_slots(id) ON DELETE CASCADE
);

-- ==============================
-- CONSULTATION NOTES
-- ==============================
CREATE TABLE consultation_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT UNIQUE,
    doctor_id INT,
    patient_id INT,

    reason_for_visit TEXT,
    diagnosis TEXT,
    prescription TEXT,
    additional_notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==============================
-- RECORD ACCESS (CONTROL SYSTEM)
-- ==============================
CREATE TABLE record_access (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT,
    doctor_id INT,
    file_id INT,

    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,

    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
);

-- ==============================
-- REVIEWS
-- ==============================
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT UNIQUE,
    patient_id INT,
    doctor_id INT,

    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==============================
-- NOTIFICATIONS
-- ==============================
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    type VARCHAR(50),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);