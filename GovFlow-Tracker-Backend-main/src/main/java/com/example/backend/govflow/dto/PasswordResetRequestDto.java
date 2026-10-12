package com.example.backend.govflow.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

/**
 * DTO لاستقبال طلب إعادة تعيين كلمة المرور (يحتوي على البريد الإلكتروني أو الرقم القومي).
 */
@Data
public class PasswordResetRequestDto {

    @NotEmpty(message = "Identifier is required.")
    private String identifier;
}