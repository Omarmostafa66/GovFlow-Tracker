package com.example.backend.govflow.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT) // This sets the HTTP status code for the response
public class PendingVerificationException extends RuntimeException {
    public PendingVerificationException(String message) {
        super(message);
    }
}