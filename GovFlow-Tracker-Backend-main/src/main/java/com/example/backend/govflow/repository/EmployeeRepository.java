package com.example.backend.govflow.repository;

import com.example.backend.govflow.entity.Employee;
import com.example.backend.govflow.entity.Service;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    Optional<Employee> findByNationalId(String nationalId);
    long countByService(Service service);
    List<Employee> findByService(Service service);

    // ==========================================================
    // ✅ START: الدوال الجديدة المطلوبة لـ ManagerService
    // ==========================================================
    boolean existsByNationalId(String nationalId);
    List<Employee> findByServiceId(Long serviceId);
    long countByServiceId(Long serviceId);

    // <<< ✍️ START: تمت إضافة هذه الدالة لحل المشكلة
    List<Employee> findByServiceIdIn(List<Long> serviceIds);
    // <<< ✍️ END: نهاية الإضافة
    // ==========================================================
    // ✅ END: نهاية الإضافة
    // ==========================================================
}