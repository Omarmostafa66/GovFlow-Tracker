package com.example.backend.govflow.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ReportStatsDto {
    private ReportStatValue totalRequests;
    private ReportStatValue approved;
    private ReportStatValue rejected;
    private ReportStatValue avgProcessingTime;
}