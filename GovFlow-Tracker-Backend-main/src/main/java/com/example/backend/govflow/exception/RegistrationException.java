package com.example.backend.govflow.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

// This annotation ensures that Spring Boot returns a 400 Bad Request status
// whenever this exception is thrown from a controller.
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class RegistrationException extends RuntimeException {
    public RegistrationException(String message) {
        super(message);
    }
}
