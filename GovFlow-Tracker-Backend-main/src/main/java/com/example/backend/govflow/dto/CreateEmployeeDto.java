package com.example.backend.govflow.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class CreateEmployeeDto {
    private String nationalId;
    private String fullName;
    private String jobRoleCode;
    private Long serviceId; // <<< ✍️ سنحتاج فقط ID الخدمة التي سينضم إليها الموظف
}
