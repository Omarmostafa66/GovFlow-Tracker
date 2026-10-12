package com.example.backend.govflow.entity;

public enum RequestStatus {
    SUBMITTED,                  // ✅ ADDED: When a citizen first submits the request
    PENDING,
    UNDER_REVIEW,
    APPROVED_PENDING_PAYMENT,   // This is the key status for payments
    IN_PROGRESS,
    COMPLETED,
    REJECTED,
    CANCELLED,
    PENDING_CITIZEN_ACTION      // e.g., if more documents are needed
}