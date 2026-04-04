-- 1. USERS (Modified per your Workbench)
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('PATIENT','DOCTOR','ADMIN') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. PATIENTS
CREATE TABLE PATIENTS (
    patient_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    gender ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    date_of_birth DATE NOT NULL,
    phone VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    address TEXT,
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 3. DOCTORS
CREATE TABLE DOCTORS (
    doctor_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    experience_years INT CHECK (experience_years >= 0),
    consultation_fee DECIMAL(10,2) NOT NULL CHECK (consultation_fee >= 0),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 4. DOCTOR_SCHEDULE
CREATE TABLE DOCTOR_SCHEDULE (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    day_of_week ENUM('MON','TUE','WED','THU','FRI','SAT','SUN') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration INT NOT NULL CHECK (slot_duration > 0),
    max_patients INT NOT NULL CHECK (max_patients > 0),
    FOREIGN KEY (doctor_id) REFERENCES DOCTORS(doctor_id) ON DELETE CASCADE
);

-- 5. APPOINTMENT_SLOTS (Modified per your Workbench)
CREATE TABLE `appointment_slots` (
  `slot_id` int NOT NULL AUTO_INCREMENT,
  `doctor_id` int NOT NULL,
  `slot_number` int NOT NULL,
  `slot_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `is_booked` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`slot_id`),
  UNIQUE KEY `doctor_id` (`doctor_id`,`slot_date`,`start_time`),
  UNIQUE KEY `doctor_id_2` (`doctor_id`,`slot_date`,`slot_number`),
  CONSTRAINT `appointment_slots_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`doctor_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 6. APPOINTMENTS (Modified per your Workbench)
CREATE TABLE `appointments` (
  `appointment_id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `doctor_id` int NOT NULL,
  `slot_id` int NOT NULL,
  `slot_number` int NOT NULL,
  `appointment_date` date NOT NULL,
  `status` enum('PENDING','CONFIRMED','CANCELLED','COMPLETED') DEFAULT 'PENDING',
  `reason` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`appointment_id`),
  UNIQUE KEY `slot_id` (`slot_id`),
  KEY `patient_id` (`patient_id`),
  KEY `doctor_id` (`doctor_id`),
  CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE CASCADE,
  CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`doctor_id`) ON DELETE CASCADE,
  CONSTRAINT `appointments_ibfk_3` FOREIGN KEY (`slot_id`) REFERENCES `appointment_slots` (`slot_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 7. WAITLIST
CREATE TABLE WAITLIST (
    waitlist_id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    patient_id INT NOT NULL,
    requested_date DATE NOT NULL,
    priority INT DEFAULT 1 CHECK (priority > 0),
    status ENUM('WAITING','ALLOCATED','CANCELLED') DEFAULT 'WAITING',
    FOREIGN KEY (doctor_id) REFERENCES DOCTORS(doctor_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES PATIENTS(patient_id) ON DELETE CASCADE
);

-- 8. MEDICAL_HISTORY
CREATE TABLE MEDICAL_HISTORY (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL UNIQUE,
    allergies TEXT,
    chronic_diseases TEXT,
    past_surgeries TEXT,
    family_history TEXT,
    FOREIGN KEY (patient_id) REFERENCES PATIENTS(patient_id) ON DELETE CASCADE
);

-- 9. MEDICAL_RECORDS
CREATE TABLE MEDICAL_RECORDS (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL UNIQUE,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    diagnosis TEXT NOT NULL,
    treatment TEXT,
    notes TEXT,
    record_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES APPOINTMENTS(appointment_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES PATIENTS(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES DOCTORS(doctor_id) ON DELETE CASCADE
);

-- 10. MEDICAL_RECORD_ACCESS_REQUEST (The missing 12th table)
CREATE TABLE MEDICAL_RECORD_ACCESS_REQUEST (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    patient_id INT NOT NULL,
    status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    response_date TIMESTAMP NULL,
    FOREIGN KEY (doctor_id) REFERENCES DOCTORS(doctor_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES PATIENTS(patient_id) ON DELETE CASCADE,
    UNIQUE (doctor_id, patient_id)
);

-- 11. PAYMENTS
CREATE TABLE PAYMENTS (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    payment_method ENUM('CASH','CARD','UPI','NETBANKING') NOT NULL,
    payment_status ENUM('PENDING','PAID','FAILED') DEFAULT 'PENDING',
    payment_date TIMESTAMP NULL,
    FOREIGN KEY (appointment_id) REFERENCES APPOINTMENTS(appointment_id) ON DELETE CASCADE
);

-- 12. REVIEWS
CREATE TABLE REVIEWS (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES PATIENTS(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES DOCTORS(doctor_id) ON DELETE CASCADE,
    UNIQUE (patient_id, doctor_id)
);