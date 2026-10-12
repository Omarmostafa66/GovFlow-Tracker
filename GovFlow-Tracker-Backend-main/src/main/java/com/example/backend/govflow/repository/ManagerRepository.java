package com.example.backend.govflow.repository;

import com.example.backend.govflow.entity.Manager;
import com.example.backend.govflow.entity.Service; // ✅ Required import added
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository; // ✅ Added for clarity
import java.util.Optional;

@Repository
public interface ManagerRepository extends JpaRepository<Manager, Long> {

    // This method is needed to find the manager responsible for a specific service.
    Optional<Manager> findByService(Service service);
    // Finds a manager by their national ID
    Optional<Manager> findByNationalId(String nationalId);
}