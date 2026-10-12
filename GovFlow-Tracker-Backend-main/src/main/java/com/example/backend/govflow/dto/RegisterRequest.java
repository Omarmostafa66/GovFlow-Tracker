package com.example.backend.govflow.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotEmpty(message = "Full name is required.")
    private String fullName;

    @NotEmpty(message = "National ID is required.")
    private String nationalId;

    @NotEmpty(message = "Email is required.")
    @Email(message = "Email should be valid.")
    private String email;

    @NotEmpty(message = "Password is required.")
    @Size(min = 8, message = "Password must be at least 8 characters long.")
    private String password;

    private String role;

    // ✅ START: FINAL FIX FOR PHONE NUMBER
    // The regular expression now correctly validates the full international phone number format.
    // The error message is now much more user-friendly.
    @Pattern(regexp = "^\\+\\d{11,14}$", message = "Please enter a valid phone number in the international format, including the country code (e.g., +201012345678).")
    // ✅ END: FINAL FIX FOR PHONE NUMBER
    private String phoneNumber;

    private String address;
    private String jobRoleCode;
}

