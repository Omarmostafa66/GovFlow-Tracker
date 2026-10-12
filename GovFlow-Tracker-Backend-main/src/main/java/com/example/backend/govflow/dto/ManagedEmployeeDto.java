package com.example.backend.govflow.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
@AllArgsConstructor
public class ManagedEmployeeDto {
    private Long id;
    private String fullName;
    private String email;
    private String jobRoleCode;
    private String departmentName;
    private boolean isRegistered;
    private OffsetDateTime deletedAt;
}