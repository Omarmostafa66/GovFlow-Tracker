package com.example.backend.govflow.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ✅ START: NEW FILE
 * This DTO is used to return the essential details of a newly created employee
 * to the frontend. It's a clean way to provide the necessary information for the
 * success card without exposing the entire Employee entity.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeDetailsDto {
    private String fullName;
    private String nationalId;
    private String jobRoleCode;
}
