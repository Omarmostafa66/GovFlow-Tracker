package com.example.backend.govflow.repository;

import com.example.backend.govflow.dto.ServiceTypeStatDto;
import com.example.backend.govflow.entity.Employee;
import com.example.backend.govflow.entity.RequestStatus;
import com.example.backend.govflow.entity.ServiceRequest;
import com.example.backend.govflow.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {

    List<ServiceRequest> findByAssignedEmployee(Employee assignedEmployee);
    List<ServiceRequest> findByAssignedEmployeeId(Long employeeId);
    long countByAssignedEmployeeIdAndStatus(Long employeeId, RequestStatus status);
    List<ServiceRequest> findByCitizenIdAndStatus(Long citizenId, RequestStatus status);
    List<ServiceRequest> findByCitizenId(Long citizenId);
    long countByCitizenAndStatus(User citizen, RequestStatus status);
    List<ServiceRequest> findTop5ByCitizenOrderBySubmissionDateDesc(User citizen);
    List<ServiceRequest> findByDepartment(String departmentName);
    long countByDepartmentAndStatus(String department, RequestStatus status);
    long countByDepartment(String department);
    @Query("SELECT sr FROM ServiceRequest sr LEFT JOIN FETCH sr.documents WHERE sr.id = :requestId AND sr.citizen.id = :citizenId")
    Optional<ServiceRequest> findByIdAndCitizenIdWithDocuments(@Param("requestId") Long requestId, @Param("citizenId") Long citizenId);
    @Query("SELECT sr FROM ServiceRequest sr LEFT JOIN FETCH sr.documents WHERE sr.citizen.id = :citizenId")
    List<ServiceRequest> findByCitizenIdWithDocuments(@Param("citizenId") Long citizenId);

    // ==========================================================
    // ✅ START: الدوال الجديدة المطلوبة لـ ManagerService
    // ==========================================================
    long countByAssignedEmployeeIdIn(List<Long> employeeIds);

    @Query("SELECT count(sr) FROM ServiceRequest sr WHERE sr.assignedEmployee.id IN :employeeIds AND sr.status = :status")
    long countByAssignedEmployeeIdInAndStatus(@Param("employeeIds") List<Long> employeeIds, @Param("status") RequestStatus status);

    long countByAssignedEmployeeId(Long employeeId);

    @Query("SELECT new com.example.backend.govflow.dto.ServiceTypeStatDto(sr.serviceName, COUNT(sr)) " +
            "FROM ServiceRequest sr " +
            "WHERE sr.assignedEmployee.id IN :employeeIds " +
            "GROUP BY sr.serviceName " +
            "ORDER BY COUNT(sr) DESC")
    List<ServiceTypeStatDto> findServiceTypeStatsByEmployeeIds(@Param("employeeIds") List<Long> employeeIds);

    // <<< ✍️ START: إضافة التعديل المطلوب
    List<ServiceRequest> findByServiceIdIn(List<Long> serviceIds);
    // <<< ✍️ END: نهاية التعديل
    // ==========================================================
    // ✅ END: نهاية الإضافة
    // ==========================================================
}