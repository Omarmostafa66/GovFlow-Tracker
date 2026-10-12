package com.example.backend.govflow.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CitizenPaymentSummaryDto {
    private BigDecimal totalReceived;
    private BigDecimal totalPending;
    // Add other fields if needed, e.g., comparison to last month
}