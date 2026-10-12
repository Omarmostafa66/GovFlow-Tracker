package com.example.backend.govflow.controller;

import com.example.backend.govflow.dto.*;
import com.example.backend.govflow.entity.Employee;
import com.example.backend.govflow.entity.User;
import com.example.backend.govflow.service.EmployeeService;
import com.example.backend.govflow.service.ManagerService;
import com.example.backend.govflow.service.ServiceRequestService;
import com.example.backend.govflow.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/manager")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('MANAGER')")
public class ManagerController {

    private final UserService userService;
    private final ServiceRequestService serviceRequestService;
    private final ManagerService managerService;
    private final EmployeeService employeeService;

    @GetMapping("/dashboard")
    public ResponseEntity<ManagerDashboardDto> getManagerDashboard(@AuthenticationPrincipal User currentUser) {
        ManagerDashboardDto dashboardData = managerService.getDashboardStats(currentUser);
        return ResponseEntity.ok(dashboardData);
    }

    //  تعديل نوع الإرجاع ليتوافق مع DTO الجديد
    @GetMapping("/managed-employees")
    public ResponseEntity<List<ManagedEmployeeDto>> getManagedEmployees(@AuthenticationPrincipal User currentUser) {
        List<ManagedEmployeeDto> employees = managerService.getManagedEmployees(currentUser);
        return ResponseEntity.ok(employees);
    }


    @GetMapping("/managed-services")
    public ResponseEntity<List<ServiceScopeDto>> getManagedServices(@AuthenticationPrincipal User currentUser) {
        List<ServiceScopeDto> services = managerService.getManagedServicesForCurrentUser(currentUser);
        return ResponseEntity.ok(services);
    }

    /**
     * This endpoint now returns the new EmployeeDetailsDto after successfully creating an employee.
     * This provides the frontend with the necessary data to display the success card.
     */
    @PostMapping("/employees")
    public ResponseEntity<EmployeeDetailsDto> createEmployee(
            @Valid @RequestBody CreateEmployeeRequestDto request) {
        Employee newEmployee = employeeService.createEmployee(request);
        // Map the created Employee entity to the DTO
        EmployeeDetailsDto employeeDetails = new EmployeeDetailsDto(
                newEmployee.getFullName(),
                newEmployee.getNationalId(),
                newEmployee.getJobRoleCode()
        );
        return new ResponseEntity<>(employeeDetails, HttpStatus.CREATED);
    }


    //  تم تعديل Endpoint الحذف وإضافة endpoint للاسترجاع
    @DeleteMapping("/employees/{employeeId}")
    public ResponseEntity<Void> deleteEmployee(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long employeeId) {
        managerService.softDeleteEmployee(employeeId, currentUser);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/employees/{employeeId}/restore")
    public ResponseEntity<Void> restoreEmployee(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long employeeId) {
        managerService.restoreEmployee(employeeId, currentUser);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/employees/{id}")
    public ResponseEntity<UserDto> updateEmployee(@PathVariable Long id, @Valid @RequestBody UpdateEmployeeDto employeeDto) {
        UserDto updatedUser = userService.updateEmployee(id, employeeDto);
        return ResponseEntity.ok(updatedUser);
    }


    @GetMapping("/reports")
    public ResponseEntity<ScopedReportDto> getReportData(@AuthenticationPrincipal User currentUser) {
        ScopedReportDto scopedReport = managerService.getScopedReportData(currentUser);
        return ResponseEntity.ok(scopedReport);
    }

}