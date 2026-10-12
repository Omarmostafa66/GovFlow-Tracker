package com.example.backend.govflow.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "pending_registrations")
@Data
public class PendingRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fullName;
    private String nationalId;
    private String email;
    private String password;
    private String phoneNumber;
    private String address;
    private String role;
    private String jobRoleCode;

    private String verificationToken;
    private LocalDateTime tokenExpiry;

    private int resendAttempts;
    private LocalDateTime lastResendRequestAt;
    private LocalDateTime createdAt;
}