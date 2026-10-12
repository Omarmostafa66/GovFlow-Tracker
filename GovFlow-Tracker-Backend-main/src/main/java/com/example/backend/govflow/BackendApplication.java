package com.example.backend.govflow;

// ضيف الـ imports دي في أول الملف
import com.example.backend.govflow.security.FileStorageProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@EnableConfigurationProperties(FileStorageProperties.class) // <-- ضيف السطر ده
public class
BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }}

