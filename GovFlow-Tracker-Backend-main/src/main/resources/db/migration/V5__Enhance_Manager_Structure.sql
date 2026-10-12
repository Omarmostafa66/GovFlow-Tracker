-- ########## 1. تعديل جدول المدراء لربطهم بنطاق عمل محدد ##########

-- الخطوة 1: إضافة أعمدة جديدة إلى جدول `managers` لتحديد نطاق صلاحياتهم.
ALTER TABLE managers
    ADD COLUMN manager_id VARCHAR(50),      -- كود المدير الفريد (e.g., MGR-TD-C1-001)
    ADD COLUMN service_id BIGINT,           -- لربط المدير بخدمة (كارت) معين
    ADD COLUMN department_id BIGINT;        -- لربط المدير بقسم كامل (رئيس القسم)

-- الخطوة 2: إضافة القيود (Constraints) للأعمدة الجديدة.
-- التأكد من أن كود المدير فريد من نوعه
ALTER TABLE managers
    ADD CONSTRAINT uq_manager_id UNIQUE (manager_id);

-- إضافة مفاتيح خارجية لربط المدراء بالجداول الأخرى
ALTER TABLE managers
    ADD CONSTRAINT fk_managers_service FOREIGN KEY (service_id) REFERENCES services(id),
    ADD CONSTRAINT fk_managers_department FOREIGN KEY (department_id) REFERENCES departments(id);

-- قيد للتأكد من أن المدير إما مسؤول عن خدمة أو عن قسم، وليس كليهما معًا
ALTER TABLE managers
    ADD CONSTRAINT chk_manager_scope CHECK (
        (service_id IS NOT NULL AND department_id IS NULL) OR  -- مدير كارت/خدمة
        (service_id IS NULL AND department_id IS NOT NULL)     -- مدير قسم (رئيس)
        );


-- ########## 2. إضافة بيانات المدراء المعرفين مسبقًا ##########

-- الخطوة 3: إضافة مدراء الخدمات (Card Managers) المسؤولين عن خدمات معينة.
INSERT INTO managers (national_id, full_name, job_role_code, manager_id, service_id, is_registered)
VALUES
    -- ===============================================
-- ========= مدراء كروت قسم المرور (Traffic) =========
-- ===============================================
    ('30105150101234', 'Adel Karim Fouad Adel', 'MGR-TD-C1', 'MGR-TD-C1-001', (SELECT id FROM services WHERE department_id = 1 AND card_code = 'C1'), FALSE), -- مدير إصدار الرخص
    ('29908200204567', 'Noha Hamdy Shaker Ali', 'MGR-TD-C2', 'MGR-TD-C2-001', (SELECT id FROM services WHERE department_id = 1 AND card_code = 'C2'), FALSE), -- مدير تجديد الرخص
-- ** مدير جديد **
    ('29811210108876', 'Hisham Fares Abdelhamid Said', 'MGR-TD-C3', 'MGR-TD-C3-001', (SELECT id FROM services WHERE department_id = 1 AND card_code = 'C3'), FALSE), -- مدير بدل فاقد
-- ** مدير جديد **
    ('29709250209911', 'Magdy Kamal Aziz Mikhail', 'MGR-TD-C4', 'MGR-TD-C4-001', (SELECT id FROM services WHERE department_id = 1 AND card_code = 'C4'), FALSE), -- مدير دفع المخالفات
-- ** مدير جديد **
    ('29603100305432', 'Amgad Helmy Metwally Ibrahim', 'MGR-TD-C5', 'MGR-TD-C5-001', (SELECT id FROM services WHERE department_id = 1 AND card_code = 'C5'), FALSE), -- مدير تسجيل المركبات

-- ===============================================
-- ====== مدراء كروت قسم البلدية (Municipality) ======
-- ===============================================
    ('30211050308910', 'Sameh Roshdy Gerges Said', 'MGR-LM-C1', 'MGR-LM-C1-001', (SELECT id FROM services WHERE department_id = 2 AND card_code = 'C1'), FALSE), -- مدير تصاريح البناء
    ('29801250401122', 'Laila Ahmed Zaki Mahmoud', 'MGR-LM-C2', 'MGR-LM-C2-001', (SELECT id FROM services WHERE department_id = 2 AND card_code = 'C2'), FALSE), -- مدير تجديد تصاريح البناء
-- ** مدير جديد **
    ('30102150104789', 'Nevine George Shafik Hanna', 'MGR-LM-C3', 'MGR-LM-C3-001', (SELECT id FROM services WHERE department_id = 2 AND card_code = 'C3'), FALSE), -- مدير تصاريح الترميم
-- ** مدير جديد **
    ('30304190201597', 'Bassem Yacoub Mansour Bishara', 'MGR-LM-C4', 'MGR-LM-C4-001', (SELECT id FROM services WHERE department_id = 2 AND card_code = 'C4'), FALSE), -- مدير شكاوى مخالفات البناء
-- ** مدير جديد **
    ('29906230302468', 'Dina Wagdy Gabriel Fawzy', 'MGR-LM-C5', 'MGR-LM-C5-001', (SELECT id FROM services WHERE department_id = 2 AND card_code = 'C5'), FALSE); -- مدير شكاوى النظافة


-- الخطوة 4: إضافة مدراء الأقسام (Department Heads) المسؤولين عن أقسام كاملة (بدون تغيير).
INSERT INTO managers (national_id, full_name, job_role_code, manager_id, department_id, is_registered)
VALUES
    -- رئيس قسم المرور
    ('30007100101314', 'Khalid Abdullah Omar Hassan', 'MGR-TD-ALL', 'MGR-TD-ALL-001', (SELECT id FROM departments WHERE name = 'Traffic Department'), FALSE),
    -- رئيس قسم البلدية
    ('29703030201526', 'Fatima Ali Hassan Ibrahim', 'MGR-LM-ALL', 'MGR-LM-ALL-001', (SELECT id FROM departments WHERE name = 'Local Municipality'), FALSE);