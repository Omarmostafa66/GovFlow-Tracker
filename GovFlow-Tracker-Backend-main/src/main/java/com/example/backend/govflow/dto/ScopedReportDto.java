package com.example.backend.govflow.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class ScopedReportDto {
    private ReportDataDto report;
    private String managerScope;
}