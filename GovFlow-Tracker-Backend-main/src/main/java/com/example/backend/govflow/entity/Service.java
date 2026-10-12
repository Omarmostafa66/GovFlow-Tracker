package com.example.backend.govflow.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "services")
@Getter
@Setter
@NoArgsConstructor
public class Service {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    @JsonBackReference
    private Department department;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "base_fee", precision = 10, scale = 2)
    private BigDecimal baseFee;

    @Column(name = "card_code", length = 10)
    private String cardCode;

    @Column(name = "max_employees")
    private int maxEmployees;

    @Column(name = "last_assigned_employee_index", columnDefinition = "integer default 0")
    private int lastAssignedEmployeeIndex = 0;

    @OneToMany(mappedBy = "service", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<ServiceRequest> requests;

    @OneToMany(mappedBy = "service", fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<Employee> employees;

    // <<< ✍️ START: التعديل المطلوب لحل المشكلة بشكل نهائي
    // Getters يدوية وصريحة لضمان أن الـ IDE يستطيع الوصول إليها دائماً
    public Department getDepartment() {
        return department;
    }

    public String getCardCode() {
        return cardCode;
    }

    public Long getId() {
        return id;
    }
    // <<< ✍️ END: نهاية التعديل

    // Helper methods
    public void addServiceRequest(ServiceRequest request) {
        if (this.requests == null) { this.requests = new ArrayList<>(); }
        this.requests.add(request);
        request.setService(this);
    }
    public void removeServiceRequest(ServiceRequest request) {
        if (this.requests != null) { this.requests.remove(request); request.setService(null); }
    }
    public void addEmployee(Employee employee) {
        if (this.employees == null) { this.employees = new ArrayList<>(); }
        this.employees.add(employee);
        employee.setService(this);
    }
    public void removeEmployee(Employee employee) {
        if (this.employees != null) { this.employees.remove(employee); employee.setService(null); }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Service service = (Service) o;
        return Objects.equals(id, service.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Service{" + "id=" + id + ", name='" + name + '\'' + ", cardCode='" + cardCode + '\'' + '}';
    }
}