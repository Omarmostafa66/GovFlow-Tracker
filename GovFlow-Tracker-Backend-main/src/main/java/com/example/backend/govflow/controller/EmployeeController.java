package com.example.backend.govflow.controller;

import com.example.backend.govflow.dto.*;
import com.example.backend.govflow.entity.Employee;
import com.example.backend.govflow.entity.ServiceRequest;
import com.example.backend.govflow.entity.User;
import com.example.backend.govflow.repository.EmployeeRepository;
import com.example.backend.govflow.repository.ServiceRequestRepository;
import com.example.backend.govflow.service.EmployeeService;
import com.example.backend.govflow.service.ServiceRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/employee")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('EMPLOYEE') or hasAuthority('MANAGER')")
public class EmployeeController {

    private final ServiceRequestService serviceRequestService;
    private final ServiceRequestRepository serviceRequestRepository;
    private final EmployeeService employeeService;
    private final EmployeeRepository employeeRepository;

    /**
     * Combines stats and the latest tasks for the employee dashboard.
     * @param employee The currently authenticated user, treated as an employee.
     * @return A DTO containing dashboard statistics and a list of tasks.
     */
    @GetMapping("/dashboard")
    public ResponseEntity<EmployeeDashboardDto> getDashboardData(@AuthenticationPrincipal User employee) {
        // تم نقل المنطق إلى ServiceRequestService لتنظيم الكود
        EmployeeDashboardDto dashboardData = serviceRequestService.getEmployeeDashboardData(employee);
        return ResponseEntity.ok(dashboardData);
    }

    @GetMapping("/my-tasks")
    public ResponseEntity<List<EmployeeTaskDto>> getMyTasks(@AuthenticationPrincipal User currentUser) {
        Optional<Employee> employeeOpt = employeeRepository.findByNationalId(currentUser.getNationalId());

        if (employeeOpt.isEmpty()) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        List<ServiceRequest> requests = serviceRequestRepository.findByAssignedEmployee(employeeOpt.get());
        List<EmployeeTaskDto> tasks = requests.stream()
                .map(EmployeeTaskDto::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(tasks);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('MANAGER')")
    public ResponseEntity<Employee> addEmployee(@RequestBody CreateEmployeeRequestDto employeeDto) {
        Employee newEmployee = employeeService.createEmployee(employeeDto);
        return new ResponseEntity<>(newEmployee, HttpStatus.CREATED);
    }

    @GetMapping("/requests")
    public ResponseEntity<List<ServiceRequestDto>> getAllRequestsForDepartment(@AuthenticationPrincipal User employee) {
        String departmentName = employee.getDepartment().getName();
        List<ServiceRequestDto> requests = serviceRequestService.getAllRequestsForDepartment(departmentName);
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/requests/{requestId}")
    public ResponseEntity<ServiceRequestDto> getRequestDetails(@PathVariable Long requestId) {
        ServiceRequestDto requestDto = serviceRequestService.getRequestDetailsById(requestId);
        return ResponseEntity.ok(requestDto);
    }

    @GetMapping("/stats")
    public ResponseEntity<List<DashboardStatsDto>> getDashboardStats(@AuthenticationPrincipal User employee) {
        String departmentName = employee.getDepartment().getName();
        List<DashboardStatsDto> stats = serviceRequestService.getDepartmentStats(departmentName);
        return ResponseEntity.ok(stats);
    }

    @PatchMapping("/requests/{requestId}/review")
    public ResponseEntity<ServiceRequestDto> reviewRequest(
            @PathVariable Long requestId,
            @RequestBody ReviewRequestDto reviewDto) {
        ServiceRequestDto updatedRequest = serviceRequestService.reviewRequest(requestId, reviewDto.getStatus(), reviewDto.getEmployeeComments());
        return ResponseEntity.ok(updatedRequest);
    }

    @GetMapping("/tasks")
    public ResponseEntity<List<EmployeeTaskDto>> getTasks(@AuthenticationPrincipal User employee) {
        String departmentName = employee.getDepartment().getName();
        List<ServiceRequest> requests = serviceRequestRepository.findByDepartment(departmentName);
        List<EmployeeTaskDto> tasks = requests.stream()
                .map(EmployeeTaskDto::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tasks);
    }
}