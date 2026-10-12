package com.example.backend.govflow.repository;

import com.example.backend.govflow.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {

    /**
     * Finds a department by its unique name.
     * This is crucial for converting the department name string from the DTO into a full entity object.
     * @param name The name of the department to find.
     * @return An Optional containing the Department if found, otherwise empty.
     */
    Optional<Department> findByName(String name);
}