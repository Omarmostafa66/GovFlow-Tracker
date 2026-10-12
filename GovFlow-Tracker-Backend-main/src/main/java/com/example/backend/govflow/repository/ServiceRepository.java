package com.example.backend.govflow.repository;

import com.example.backend.govflow.entity.Department;
import com.example.backend.govflow.entity.Service;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceRepository extends JpaRepository<Service, Long> {

    /**
     * Finds a service by its unique name.
     */
    Optional<Service> findByName(String name);

    /**
     * Finds all services associated with a specific department entity.
     */
    List<Service> findByDepartment(Department department);

    /**
     * ✅ تعديل: تم تغيير الـ method لتبحث باستخدام الـ Department object.
     * This is the primary method used to uniquely identify a service before creation.
     * It now takes a full Department entity to ensure type safety and align with the database schema.
     */
    Optional<Service> findByNameAndDepartment(String name, Department department);
    List<Service> findByDepartmentId(Long departmentId);
}