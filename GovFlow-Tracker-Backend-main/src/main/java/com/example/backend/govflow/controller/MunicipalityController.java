package com.example.backend.govflow.controller;

import com.example.backend.govflow.entity.Department; // ✅ 1. إضافة import
import com.example.backend.govflow.entity.Service;
import com.example.backend.govflow.repository.DepartmentRepository; // ✅ 2. إضافة import
import com.example.backend.govflow.repository.ServiceRepository;
import jakarta.persistence.EntityNotFoundException; // ✅ 3. إضافة import
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/municipality")
@RequiredArgsConstructor
public class MunicipalityController {

    private final ServiceRepository serviceRepository;
    private final DepartmentRepository departmentRepository; // ✅ 4. إضافة DepartmentRepository

    @GetMapping("/services")
    public ResponseEntity<List<Service>> getMunicipalityServices() {
        // ✅ 5. ابحث عن قسم البلدية (Local Municipality) أولاً
        Department municipalityDepartment = departmentRepository.findByName("Local Municipality")
                .orElseThrow(() -> new EntityNotFoundException("Department 'Local Municipality' not found."));

        // ✅ 6. استخدم الـ Department object اللي حصلت عليه عشان تجيب الخدمات بتاعته
        List<Service> services = serviceRepository.findByDepartment(municipalityDepartment);

        return ResponseEntity.ok(services);
    }
}