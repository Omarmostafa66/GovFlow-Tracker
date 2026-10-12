package com.example.backend.govflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DTO لإكمال عملية إعادة تعيين كلمة المرور (يحتوي على الرمز وكلمة المرور الجديدة).
 */
@Data
public class PasswordResetCompletionDto {

    @NotBlank(message = "Token is required")
    private String token;

    @NotBlank(message = "New password is required")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    private String newPassword;
}