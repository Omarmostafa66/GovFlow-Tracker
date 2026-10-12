package com.example.backend.govflow.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PerformanceMetricDto {
    private String department;
    private int totalRequests;
    private int approved;
    private int rejected;
    private String approvalRate;
    private double avgTime; // In days
    private String slaCompliance;
}