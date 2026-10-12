package com.example.backend.govflow.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.OffsetDateTime;
import java.util.Objects;

@Entity
@Table(name = "managers")
@Getter
@Setter
@NoArgsConstructor
public class Manager {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "manager_id", unique = true, length = 50)
    private String managerId;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id")
    private Service service;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    public Department getDepartment() {
        return department;
    }

    public Service getService() {
        return service;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Manager manager = (Manager) o;
        return Objects.equals(id, manager.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Manager{" + "id=" + id + ", fullName='" + fullName + '\'' + ", managerId='" + managerId + '\'' + '}';
    }
}