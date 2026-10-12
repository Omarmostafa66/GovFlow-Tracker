package com.example.backend.govflow.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ProcessPaymentDto {
    private Long serviceRequestId;
    private double amount; // This field might not be used by the backend logic but should match the frontend request
}