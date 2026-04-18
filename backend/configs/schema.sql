

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

    specialization VARCHAR(100),
    experience INT,
    hospital_name VARCHAR(100),
    address TEXT,

    is_verified BOOLEAN DEFAULT FALSE,
    average_rating FLOAT DEFAULT 0,

    profile_image_id INT,
    certificate_file_id INT,   -- public certificate

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (profile_image_id) REFERENCES files(id) ON DELETE SET NULL,
    FOREIGN KEY (certificate_file_id) REFERENCES files(id) ON DELETE SET NULL
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

    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (certificate_file_id) REFERENCES files(id) ON DELETE CASCADE
);

-- ==============================
-- APPOINTMENT SLOTS (1–24)
-- ==============================
CREATE TABLE appointment_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT,
    slot_date DATE,

    slot_number INT CHECK (slot_number BETWEEN 1 AND 24),

    is_active BOOLEAN DEFAULT TRUE,
    is_booked BOOLEAN DEFAULT FALSE,

    UNIQUE (doctor_id, slot_date, slot_number),

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