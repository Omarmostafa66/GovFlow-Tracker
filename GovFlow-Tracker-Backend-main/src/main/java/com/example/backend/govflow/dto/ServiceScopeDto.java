package com.example.backend.govflow.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ServiceScopeDto {
    private Long id;
    private String name;
    private String cardCode;
    private DepartmentDto department;
}
