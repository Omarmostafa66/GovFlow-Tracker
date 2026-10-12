package com.example.backend.govflow.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.OffsetDateTime;

@Entity
@Table(name = "employees")
@Data
@NoArgsConstructor
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", unique = true, length = 50)
    private String employeeId;

    @Column(name = "national_id", unique = true, nullable = false, length = 14)
    private String nationalId;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "job_role_code", nullable = false, length = 50)
    private String jobRoleCode;

    @Column(name = "is_registered")
    private boolean isRegistered = false;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    // <<< ✍️ START: التعديل المطلوب
    // تمت إضافة هذا الحقل لتتبع الحذف المؤقت
    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;
    // <<< ✍️ END: التعديل المطلوب

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id")
    @JsonBackReference
    private Service service;
}