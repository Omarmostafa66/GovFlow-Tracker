package com.example.backend.govflow.controller;

import com.example.backend.govflow.dto.CreateServiceRequestDto;
import com.example.backend.govflow.dto.DocumentDto;
import com.example.backend.govflow.dto.ServiceRequestDto;
import com.example.backend.govflow.entity.User;
import com.example.backend.govflow.service.ServiceRequestService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/requests")
@RequiredArgsConstructor
public class ServiceRequestController {

    private final ServiceRequestService serviceRequestService;
    private final ObjectMapper objectMapper;

    @PostMapping
    @PreAuthorize("hasAuthority('CITIZEN')")
    public ResponseEntity<?> createServiceRequest(
            @RequestParam("request") String requestJson,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            Authentication authentication) {
        try {
            User currentUser = (User) authentication.getPrincipal();
            CreateServiceRequestDto requestDto = objectMapper.readValue(requestJson, CreateServiceRequestDto.class);
            ServiceRequestDto newRequest = serviceRequestService.createRequest(requestDto, currentUser, files);
            return new ResponseEntity<>(newRequest, HttpStatus.CREATED);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An internal error occurred: " + e.getMessage());
        }
    }

    @GetMapping
    @PreAuthorize("hasAuthority('CITIZEN')")
    public ResponseEntity<List<ServiceRequestDto>> getMyRequests(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        List<ServiceRequestDto> requests = serviceRequestService.getRequestsForCitizen(currentUser.getId());
        return ResponseEntity.ok(requests);
    }

    @PostMapping("/{id}/documents")
    @PreAuthorize("hasAuthority('CITIZEN')")
    public ResponseEntity<?> uploadDocument(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        try {
            User currentUser = (User) authentication.getPrincipal();
            Map<String, Object> result = serviceRequestService.uploadDocument(id, file, currentUser);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload document: " + e.getMessage());
        }
    }

    /**
     * ✅ START: ENDPOINT جديد لاستبدال مستند موجود
     */
    @PostMapping("/{requestId}/documents/{docId}/replace")
    @PreAuthorize("hasAuthority('CITIZEN')")
    public ResponseEntity<?> replaceDocument(
            @PathVariable Long requestId,
            @PathVariable Long docId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        try {
            User currentUser = (User) authentication.getPrincipal();
            DocumentDto updatedDocument = serviceRequestService.replaceDocument(requestId, docId, file, currentUser);
            return ResponseEntity.ok(updatedDocument);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to replace document: " + e.getMessage());
        }
    }
    /**
     * ✅ END: نهاية الإضافة
     */

    @DeleteMapping("/{id}/documents/{docId}")
    @PreAuthorize("hasAuthority('CITIZEN')")
    public ResponseEntity<?> deleteDocument(
            @PathVariable Long id,
            @PathVariable Long docId,
            Authentication authentication) {
        try {
            User currentUser = (User) authentication.getPrincipal();
            serviceRequestService.deleteDocument(id, docId, currentUser);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to delete document: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('CITIZEN')")
    public ResponseEntity<?> getRequestById(@PathVariable Long id, Authentication authentication) {
        try {
            User currentUser = (User) authentication.getPrincipal();
            ServiceRequestDto request = serviceRequestService.getRequestForCitizenById(currentUser.getId(), id);
            return ResponseEntity.ok(request);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to load request: " + e.getMessage());
        }
    }
}