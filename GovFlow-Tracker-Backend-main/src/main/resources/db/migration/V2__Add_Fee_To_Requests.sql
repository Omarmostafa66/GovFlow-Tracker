-- V2: This is the final, corrected script.
-- It adds the fee columns to their correct tables and populates the master data.

-- Step 1: Add the 'actual_fee' column to the 'service_requests' table.
ALTER TABLE service_requests
    ADD COLUMN actual_fee NUMERIC(10, 2);
COMMENT ON COLUMN service_requests.actual_fee IS 'The actual fee charged for this specific request.';

-- Step 2: Add the 'base_fee' column to the 'services' table.
ALTER TABLE services
    ADD COLUMN base_fee NUMERIC(10, 2);
COMMENT ON COLUMN services.base_fee IS 'The standard, official fee for this service.';

-- Step 3: Insert sample data for all services.
-- ########## Insert Traffic Services Data ##########
INSERT INTO services (department_id, name, description) VALUES
                                                            (1, 'Driver License Issuance', 'Apply for a new driver''s license.'),
                                                            (1, 'License Renewal', 'Renew your existing driver''s license.'),
                                                            (1, 'License Replacement', 'Request a replacement for your lost or damaged driver''s license.'),
                                                            (1, 'Pay Traffic Violation', 'View and pay your outstanding traffic violations.'),
                                                            (1, 'Vehicle Registration', 'Register a new vehicle.');

-- ########## Insert Municipality Services Data ##########
INSERT INTO services (department_id, name, description) VALUES
                                                            (2, 'Building Permit', 'Apply for a new building construction or renovation permit.'),
                                                            (2, 'Building Permit Renewal', 'Renew your existing building permit before it expires.'),
                                                            (2, 'Renovation Permit', 'Apply for a permit to renovate your property.'),
                                                            (2, 'Building Violation Complaint', 'Report a building violation to the municipality authorities.'),
                                                            (2, 'Cleanliness Complaint', 'Report cleanliness issues in public areas.');

-- Step 4: Update the newly inserted services with their base fees.
UPDATE services SET base_fee = 550.00 WHERE name = 'Driver License Issuance';
UPDATE services SET base_fee = 250.00 WHERE name = 'License Renewal';
UPDATE services SET base_fee = 150.00 WHERE name = 'License Replacement';
UPDATE services SET base_fee = 100.00 WHERE name = 'Pay Traffic Violation';
UPDATE services SET base_fee = 800.00 WHERE name = 'Vehicle Registration';
UPDATE services SET base_fee = 2000.00 WHERE name = 'Building Permit';
UPDATE services SET base_fee = 1200.00 WHERE name = 'Building Permit Renewal';
UPDATE services SET base_fee = 750.00 WHERE name = 'Renovation Permit';

-- Step 4: Add other miscellaneous changes if needed.
ALTER TABLE users ADD COLUMN avatar VARCHAR(255);
COMMENT ON COLUMN users.avatar IS 'File path or URL for the user''s profile picture.';
