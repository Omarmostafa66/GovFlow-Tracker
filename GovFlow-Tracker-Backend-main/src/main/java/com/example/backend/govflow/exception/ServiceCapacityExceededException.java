package com.example.backend.govflow.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT) // <<< ✍️ يرجع كود 409 Conflict عند حدوث هذا الخطأ
public class ServiceCapacityExceededException extends RuntimeException {
    public ServiceCapacityExceededException(String message) {
        super(message);
    }
}
