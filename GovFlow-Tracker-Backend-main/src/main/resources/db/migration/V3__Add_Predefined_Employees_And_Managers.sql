-- V3: Add predefined employees and managers tables for registration verification

-- Step 1: Create the 'employees' table to store predefined employee data
CREATE TABLE employees (
                           id BIGSERIAL PRIMARY KEY,
                           national_id VARCHAR(14) UNIQUE NOT NULL,
                           full_name VARCHAR(100) NOT NULL,
                           job_role_code VARCHAR(50) NOT NULL,
                           is_registered BOOLEAN DEFAULT FALSE,
                           created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE employees IS 'Stores predefined information for employees eligible to register.';
COMMENT ON COLUMN employees.is_registered IS 'Flag to check if the employee has already registered an account.';


-- Step 2: Create the 'managers' table to store predefined manager data
CREATE TABLE managers (
                          id BIGSERIAL PRIMARY KEY,
                          national_id VARCHAR(14) UNIQUE NOT NULL,
                          full_name VARCHAR(100) NOT NULL,
                          job_role_code VARCHAR(50) NOT NULL,
                          is_registered BOOLEAN DEFAULT FALSE,
                          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE managers IS 'Stores predefined information for managers eligible to register.';
COMMENT ON COLUMN managers.is_registered IS 'Flag to check if the manager has already registered an account.';


-- Step 3: Insert sample data for testing purposes

-- Sample Employees (بيانات موظفين تجريبية)
-- INSERT INTO employees (national_id, full_name, job_role_code) VALUES
--                                                                   ('29501010101010', 'Ehab Mostafa Mohamed Ahmed', 'EMP-TD-001'), -- Traffic Department
--                                                                   ('29602020202020', 'Salma Ibrahim Mahmoud Ali', 'EMP-LM-002');   -- Local Municipality

-- Sample Managers (بيانات مدراء تجريبية)
/*INSERT INTO managers (national_id, full_name, job_role_code) VALUES
                                                                 ('28503030303030', 'Khalid Abdullah Omar Hassan', 'MGR-TD-LEAD'), -- Traffic Department Manager
                                                                 ('28804040404040', 'Fatima Ali Hassan Ibrahim', 'MGR-LM-HEAD');   -- Local Municipality Manager*/





-- V4: Modify users table to allow a national ID to be registered with multiple roles
-- Step 1: Drop the existing unique constraint on the national_id column.
-- NOTE: The constraint name 'users_national_id_key' is a PostgreSQL default.
-- If your constraint has a different name, you will need to change it here.
-- You can find the name by running: \d users in psql.
ALTER TABLE users DROP CONSTRAINT users_national_id_key;

-- Step 2: Add a new composite unique constraint on both national_id and role_id.
-- This ensures that a person can have an account as a CITIZEN and an EMPLOYEE,
-- but cannot have two accounts as a CITIZEN.
ALTER TABLE users ADD CONSTRAINT uq_national_id_role_id UNIQUE (national_id, role_id);




-- V5: Add columns for email verification functionality
ALTER TABLE users ADD COLUMN verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN is_enabled BOOLEAN DEFAULT FALSE NOT NULL;

-- ملاحظة: إذا كان لديك مستخدمين حاليين في قاعدة البيانات، قم بتفعيل حساباتهم بهذا الأمر
-- UPDATE users SET is_enabled = TRUE;



-- V6: Add columns for password reset functionality
-- إضافة أعمدة لخاصية إعادة تعيين كلمة المرور
ALTER TABLE users ADD COLUMN reset_password_token VARCHAR(255);
ALTER TABLE users ADD COLUMN reset_token_expiry TIMESTAMP;




-- V7: Create pending_registrations table for two-step user registration

CREATE TABLE pending_registrations (
                                       id BIGSERIAL PRIMARY KEY,
                                       full_name VARCHAR(100) NOT NULL,
                                       national_id VARCHAR(14) NOT NULL,
                                       email VARCHAR(100) NOT NULL,
                                       password VARCHAR(255) NOT NULL, -- Storing the hashed password
                                       phone_number VARCHAR(20) NOT NULL,
                                       address VARCHAR(255),
                                       role VARCHAR(50) NOT NULL,
                                       job_role_code VARCHAR(50),

                                       verification_token VARCHAR(255) UNIQUE NOT NULL,
                                       token_expiry TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Rate limiting fields
                                       resend_attempts INT DEFAULT 0,
                                       last_resend_request_at TIMESTAMP WITH TIME ZONE,

                                       created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Ensure a user cannot have multiple pending registrations with the same national ID and role
                                       CONSTRAINT uq_pending_national_id_role UNIQUE (national_id, role)
);

COMMENT ON TABLE pending_registrations IS 'Stores user registration data temporarily until email verification is complete.';
COMMENT ON COLUMN pending_registrations.token_expiry IS 'The timestamp when the verification token expires (e.g., 1 hour after creation).';
COMMENT ON COLUMN pending_registrations.resend_attempts IS 'Tracks the number of times a verification email has been resent.';
COMMENT ON COLUMN pending_registrations.last_resend_request_at IS 'Timestamp of the last resend request to enforce cooldown.';





-- V8__Fix_Email_Constraints.sql
-- START: MODIFICATION - The following logic is corrected to enforce GLOBAL email uniqueness.
-- الهدف: التأكد من أن الإيميل فريد تمامًا في النظام كله.

-- الخطوة 1: حذف أي قيد مركب قد يكون موجودًا على الإيميل والدور في جدول users
ALTER TABLE users DROP CONSTRAINT IF EXISTS uq_email_role_id;

-- الخطوة 2: التأكد من وجود القيد الفريد على الإيميل فقط (الذي تم إنشاؤه في V1)
-- بما أن V1 ينشئه، فإننا نتجنب حذفه، وبالتالي يظل القيد الأساسي مفعلًا.
-- The unique constraint 'users_email_key' created in V1 now remains active.

-- الخطوة 3: تعديل القيود على جدول pending_registrations لتطابق القاعدة الجديدة
ALTER TABLE pending_registrations DROP CONSTRAINT IF EXISTS uq_pending_national_id_role;
ALTER TABLE pending_registrations DROP CONSTRAINT IF EXISTS uq_pending_email_role;
-- إضافة قيد فريد على الإيميل فقط لضمان عدم وجود طلبات تسجيل معلقة بنفس الإيميل
ALTER TABLE pending_registrations ADD CONSTRAINT uq_pending_email UNIQUE (email);
-- END: MODIFICATION

ALTER TABLE service_requests
    ADD COLUMN employee_comments TEXT;

COMMENT ON COLUMN service_requests.employee_comments IS 'Stores comments made by an employee when reviewing a service request.';


-- Add the new columns for invoice details to the payments table
ALTER TABLE payments
    ADD COLUMN invoice_number VARCHAR(255),
ADD COLUMN invoice_date TIMESTAMP WITHOUT TIME ZONE;

-- Add a unique constraint to the invoice_number column to match the entity definition
ALTER TABLE payments
    ADD CONSTRAINT uk_invoice_number UNIQUE (invoice_number);

