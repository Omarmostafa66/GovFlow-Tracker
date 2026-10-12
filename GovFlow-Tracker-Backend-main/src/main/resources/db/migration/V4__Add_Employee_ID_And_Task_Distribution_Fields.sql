-- 1. إضافة الأعمدة الجديدة إلى جدول الأقسام (Departments)
ALTER TABLE departments
    ADD COLUMN gov_code VARCHAR(10);

-- إضافة قيد فريد (unique constraint) بشكل منفصل لضمان التوافقية
ALTER TABLE departments
    ADD CONSTRAINT uk_departments_gov_code UNIQUE (gov_code);


-- 2. إضافة الأعمدة الجديدة إلى جدول الخدمات (Services)
ALTER TABLE services
    ADD COLUMN card_code VARCHAR(10),
ADD COLUMN max_employees INT NOT NULL DEFAULT 10, -- افترضنا قيمة افتراضية 10
ADD COLUMN last_assigned_employee_index INT NOT NULL DEFAULT 0;


-- 3. إضافة الأعمدة الجديدة إلى جدول الموظفين (Employees)
ALTER TABLE employees
    ADD COLUMN employee_id VARCHAR(50),
ADD COLUMN service_id BIGINT;

-- إضافة قيد فريد (unique constraint)
ALTER TABLE employees
    ADD CONSTRAINT uk_employees_employee_id UNIQUE (employee_id);

-- إضافة مفتاح خارجي (foreign key) لربط الموظف بالخدمة
ALTER TABLE employees
    ADD CONSTRAINT fk_employees_service
        FOREIGN KEY (service_id) REFERENCES services(id);


-- 4. إضافة عمود الموظف المسؤول إلى جدول طلبات الخدمة (Service Requests)
ALTER TABLE service_requests
    ADD COLUMN assigned_employee_id BIGINT;

-- إضافة مفتاح خارجي (foreign key) لربط الطلب بالموظف
ALTER TABLE service_requests
    ADD CONSTRAINT fk_service_requests_employee
        FOREIGN KEY (assigned_employee_id) REFERENCES employees(id);





-- ####################################################################
-- الخطوة 1: تحديث جدول الأقسام بالأكواد الحكومية (GovCode)
-- هذه الأكواد هي أساس الجزء الثاني من ID الموظف
-- ####################################################################

-- تحديث قسم المرور
UPDATE departments
SET gov_code = 'TD' -- Traffic Department
WHERE name = 'Traffic Department';

-- تحديث قسم البلدية
UPDATE departments
SET gov_code = 'LM' -- Local Municipality
WHERE name = 'Local Municipality';


-- ####################################################################
-- الخطوة 2: تحديث جدول الخدمات بأكواد الكروت (CardCode)
-- هذه الأكواد هي أساس الجزء الثالث من ID الموظف
-- ####################################################################

-- -- خدمات المرور --
UPDATE services SET card_code = 'C1' WHERE name = 'Driver License Issuance';
UPDATE services SET card_code = 'C2' WHERE name = 'License Renewal';
UPDATE services SET card_code = 'C3' WHERE name = 'License Replacement';
UPDATE services SET card_code = 'C4' WHERE name = 'Pay Traffic Violation';
UPDATE services SET card_code = 'C5' WHERE name = 'Vehicle Registration';

-- -- خدمات البلدية --
UPDATE services SET card_code = 'C1' WHERE name = 'Building Permit';
UPDATE services SET card_code = 'C2' WHERE name = 'Building Permit Renewal';
UPDATE services SET card_code = 'C3' WHERE name = 'Renovation Permit';
UPDATE services SET card_code = 'C4' WHERE name = 'Building Violation Complaint';
UPDATE services SET card_code = 'C5' WHERE name = 'Cleanliness Complaint';


-- ####################################################################
-- الخطوة 3: إضافة بيانات الموظفين مع ربطهم بالخدمات وتوليد ID فريد
-- هذه هي البيانات التي سيتم التحقق منها عند تسجيل الموظف الجديد
-- ####################################################################

INSERT INTO employees (national_id, full_name, employee_id, service_id, job_role_code) VALUES
-- ===============================================
-- ========= موظفي إدارة المرور (Traffic) =========
-- ===============================================

-- ===================================================
-- ====== موظفي إدارة المرور (Traffic Department) ======
-- ===================================================

-- موظف 1: مسؤول عن إصدار رخص القيادة (المرور)
('30111200105432', 'Ehab Mostafa Mohamed Ahmed', 'EMP-TD-C1-001', (SELECT id FROM services WHERE name = 'Driver License Issuance'), 'EMP-TD-C1-001'),
-- موظف 2: مسؤول أيضًا عن إصدار رخص القيادة (نفس الكارت، سيريال مختلف)
('29702020108877', 'Ali Hassan Mahmoud Metwally', 'EMP-TD-C1-002', (SELECT id FROM services WHERE name = 'Driver License Issuance'), 'EMP-TD-C1-002'),
-- موظف إضافي لخدمة إصدار رخص القيادة
('29901150106553', 'Karim Adel Fahmy Ibrahim', 'EMP-TD-C1-003', (SELECT id FROM services WHERE name = 'Driver License Issuance'), 'EMP-TD-C1-003'),

-- موظف 3: مسؤول عن تجديد الرخص (كارت مختلف في نفس القسم)
('29803030201122', 'Mona Said Ibrahim Abdelaziz', 'EMP-TD-C2-001', (SELECT id FROM services WHERE name = 'License Renewal'), 'EMP-TD-C2-001'),
-- موظفون إضافيون لخدمة تجديد الرخص
('30204100207890', 'Sherif Hamdy Abdelrahman Ali', 'EMP-TD-C2-002', (SELECT id FROM services WHERE name = 'License Renewal'), 'EMP-TD-C2-002'),
('30305200301244', 'Yasmin Ashraf Kamal Hassan', 'EMP-TD-C2-003', (SELECT id FROM services WHERE name = 'License Renewal'), 'EMP-TD-C2-003'),

-- موظف مسؤول عن بدل فاقد للرخص
('30005100104577', 'Hassan Ali El-Sayed Gad', 'EMP-TD-C3-001', (SELECT id FROM services WHERE name = 'License Replacement'), 'EMP-TD-C3-001'),
-- موظفون إضافيون لخدمة بدل فاقد
('29506110105555', 'Amr Tarek Shawky Mohamed', 'EMP-TD-C3-002', (SELECT id FROM services WHERE name = 'License Replacement'), 'EMP-TD-C3-002'),
('29607120206666', 'Nourhan Khaled Ismail Ahmed', 'EMP-TD-C3-003', (SELECT id FROM services WHERE name = 'License Replacement'), 'EMP-TD-C3-003'),

-- موظف مسؤول عن دفع مخالفات المرور
('29908150209886', 'Sara Gamal Mohamed Kamel', 'EMP-TD-C4-001', (SELECT id FROM services WHERE name = 'Pay Traffic Violation'), 'EMP-TD-C4-001'),
-- موظفون إضافيون لخدمة دفع المخالفات
('29409160307777', 'Mohamed Salah El-Din Ali', 'EMP-TD-C4-002', (SELECT id FROM services WHERE name = 'Pay Traffic Violation'), 'EMP-TD-C4-002'),
('29310170408888', 'Fatma Al-Zahraa Ali Mohamed', 'EMP-TD-C4-003', (SELECT id FROM services WHERE name = 'Pay Traffic Violation'), 'EMP-TD-C4-003'),

-- موظف 4: مسؤول عن تسجيل المركبات (كارت مختلف في نفس القسم)
('29404040307798', 'Ahmed Khalid Mansour Farag', 'EMP-TD-C5-001', (SELECT id FROM services WHERE name = 'Vehicle Registration'), 'EMP-TD-C5-001'),
-- موظفون إضافيون لخدمة تسجيل المركبات
('29211180109989', 'Heba Mahmoud El-Shazly Ibrahim', 'EMP-TD-C5-002', (SELECT id FROM services WHERE name = 'Vehicle Registration'), 'EMP-TD-C5-002'),
('29112190201010', 'Wael Emad Abdel-Fattah Said', 'EMP-TD-C5-003', (SELECT id FROM services WHERE name = 'Vehicle Registration'), 'EMP-TD-C5-003'),


-- ===============================================
-- ====== موظفي البلدية (Local Municipality) ======
-- ===============================================

-- موظف 5: مسؤول عن تصاريح البناء (البلدية)
('29602021122344', 'Salma Ibrahim Mahmoud Ali', 'EMP-LM-C1-001', (SELECT id FROM services WHERE name = 'Building Permit'), 'EMP-LM-C1-001'),
-- موظفون إضافيون لخدمة تصاريح البناء
('28901010302333', 'Youssef Nabil Abdel-Malek Omar', 'EMP-LM-C1-002', (SELECT id FROM services WHERE name = 'Building Permit'), 'EMP-LM-C1-002'),
('28802020403444', 'Mariam Gerges Fawzy Anton', 'EMP-LM-C1-003', (SELECT id FROM services WHERE name = 'Building Permit'), 'EMP-LM-C1-003'),

-- موظف مسؤول عن تجديد تصاريح البناء
('29003250309876', 'Tarek Fathy Abdelrahman Saad', 'EMP-LM-C2-001', (SELECT id FROM services WHERE name = 'Building Permit Renewal'), 'EMP-LM-C2-001'),
-- موظفون إضافيون لخدمة تجديد تصاريح البناء
('28703030104555', 'John Magdy Ramzy Said', 'EMP-LM-C2-002', (SELECT id FROM services WHERE name = 'Building Permit Renewal'), 'EMP-LM-C2-002'),
('28604040205666', 'Aya Adel Roshdy Kamal', 'EMP-LM-C2-003', (SELECT id FROM services WHERE name = 'Building Permit Renewal'), 'EMP-LM-C2-003'),

-- موظف مسؤول عن تصاريح التجديد والترميم
('28904100401244', 'Nadia Adel Karam Botros', 'EMP-LM-C3-001', (SELECT id FROM services WHERE name = 'Renovation Permit'), 'EMP-LM-C3-001'),
-- موظفون إضافيون لخدمة تصاريح الترميم
('28505050306777', 'Bishoy Samir Labib Mikhail', 'EMP-LM-C3-002', (SELECT id FROM services WHERE name = 'Renovation Permit'), 'EMP-LM-C3-002'),
('28406060407888', 'Ghada Hassan El-Sherbiny Taha', 'EMP-LM-C3-003', (SELECT id FROM services WHERE name = 'Renovation Permit'), 'EMP-LM-C3-003'),

-- موظف مسؤول عن شكاوى مخالفات البناء
('28805121509978', 'Mahmoud Hesham Shawky Elsayed', 'EMP-LM-C4-001', (SELECT id FROM services WHERE name = 'Building Violation Complaint'), 'EMP-LM-C4-001'),
-- موظفون إضافيون لخدمة شكاوى مخالفات البناء
('28307070108999', 'Mina Atef Helmy Zaki', 'EMP-LM-C4-002', (SELECT id FROM services WHERE name = 'Building Violation Complaint'), 'EMP-LM-C4-002'),
('28208080209080', 'Rania Fawzy Abdel-Salam Ali', 'EMP-LM-C4-003', (SELECT id FROM services WHERE name = 'Building Violation Complaint'), 'EMP-LM-C4-003'),

-- موظف 6: مسؤول عن شكاوى النظافة (كارت مختلف في قسم البلدية)
('29905050405576', 'Omar Youssef Taha Metwally', 'EMP-LM-C5-001', (SELECT id FROM services WHERE name = 'Cleanliness Complaint'), 'EMP-LM-C5-001'),
-- موظفون إضافيون لخدمة شكاوى النظافة
('28109090301212', 'Andrew Victor Zaki Boshra', 'EMP-LM-C5-002', (SELECT id FROM services WHERE name = 'Cleanliness Complaint'), 'EMP-LM-C5-002'),
('28010100402323', 'Samira Ahmed El-Gendy Kamal', 'EMP-LM-C5-003', (SELECT id FROM services WHERE name = 'Cleanliness Complaint'), 'EMP-LM-C5-003');
-- Add a column to track soft deletions for employees
ALTER TABLE employees
    ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

COMMENT ON COLUMN employees.deleted_at IS 'Timestamp when the employee was soft-deleted. NULL if active.';
