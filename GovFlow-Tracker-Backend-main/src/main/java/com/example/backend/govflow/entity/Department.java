package com.example.backend.govflow.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "departments")
@Getter
@Setter
@NoArgsConstructor
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;

    @Column(name = "gov_code", unique = true, nullable = false, length = 10)
    private String govCode;

    @OneToMany(mappedBy = "department", fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<User> users;

    @OneToMany(mappedBy = "department", fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<Service> services;

    // <<< ✍️ START: التعديل المطلوب لحل المشكلة بشكل نهائي
    // Getters يدوية وصريحة لضمان أن الـ IDE يستطيع الوصول إليها دائماً
    public String getName() {
        return name;
    }

    public String getGovCode() {
        return govCode;
    }
    // <<< ✍️ END: نهاية التعديل

    // Helper methods for maintaining bidirectional consistency with User
    public void addUser(User user) {
        if (this.users == null) { this.users = new ArrayList<>(); }
        this.users.add(user);
        user.setDepartment(this);
    }
    public void removeUser(User user) {
        if (this.users != null) { this.users.remove(user); user.setDepartment(null); }
    }
    public void addService(Service service) {
        if (this.services == null) { this.services = new ArrayList<>(); }
        this.services.add(service);
        service.setDepartment(this);
    }
    public void removeService(Service service) {
        if (this.services != null) { this.services.remove(service); service.setDepartment(null); }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Department that = (Department) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Department{" + "id=" + id + ", name='" + name + '\'' + ", govCode='" + govCode + '\'' + '}';
    }
}