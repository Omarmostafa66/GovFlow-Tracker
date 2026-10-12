package com.example.backend.govflow.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateEmployeeRequestDto {

    @NotBlank(message = "Full name is required.")
    @Size(min = 5, max = 100, message = "Full name must be between 5 and 100 characters.")
    @Pattern(regexp = "^(\\S+\\s+){3,}\\S+$", message = "Full name must be at least four parts.")
    private String fullName;

    @NotBlank(message = "National ID is required.")
    @Pattern(regexp = "^[23]\\d{13}$", message = "Invalid Egyptian National ID format.")
    private String nationalId;

//    @NotBlank(message = "Email is required.")
//    @Email(message = "Invalid email format.")
//    private String email;
//
//    @NotBlank(message = "Password is required.")
//    @Size(min = 8, message = "Password must be at least 8 characters long.")
//    private String password;

    @NotNull(message = "Service ID must be provided.")
    private Long serviceId;

    // ✅ START: تمت إضافة الحقل الناقص المطلوب لحل المشكلة
    private String jobRoleCode;
    // ✅ END: نهاية الإضافة
}