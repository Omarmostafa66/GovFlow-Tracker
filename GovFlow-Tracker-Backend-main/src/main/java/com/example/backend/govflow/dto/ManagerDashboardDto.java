package com.example.backend.govflow.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ManagerDashboardDto {
    private String managerScope;
    private long managedEmployeesCount;
    private long totalTasksInScope;
    private long completedTasksInScope;
    private long approvedTasksInScope;
    private long rejectedTasksInScope;

    private List<EmployeePerformanceDto> employeePerformance;
    // أضفنا هذه القائمة لتغذية كارت "Requests by Service Type"
    private List<ServiceTypeStatDto> serviceTypeStats;

}