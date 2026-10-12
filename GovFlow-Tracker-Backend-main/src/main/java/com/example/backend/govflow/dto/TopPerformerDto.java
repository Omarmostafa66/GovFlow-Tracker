package com.example.backend.govflow.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TopPerformerDto {
    private String initials;
    private String name;
    private String department;
    private int requestsProcessed;
    private String approvalRate;
    private String avgTime;
}