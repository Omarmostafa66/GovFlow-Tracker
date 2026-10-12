package com.example.backend.govflow.controller;

import com.example.backend.govflow.entity.Document;
import com.example.backend.govflow.entity.User;
import com.example.backend.govflow.repository.DocumentRepository;
import com.example.backend.govflow.service.FileStorageService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URLConnection;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List; // ✍️ تم إضافة import لـ List

@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class FileController {

    private static final Logger logger = LoggerFactory.getLogger(FileController.class);
    private final FileStorageService fileStorageService;
    private final DocumentRepository documentRepository;

    @GetMapping("/{requestId}/{fileName:.+}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Resource> serveFile(@AuthenticationPrincipal User currentUser,
                                              @PathVariable Long requestId,
                                              @PathVariable String fileName) {
        try {
            String decodedFileName = java.net.URLDecoder.decode(fileName, StandardCharsets.UTF_8);
            // 1. Construct a more specific search pattern to avoid broad matches.
            // This ensures we only match the full filename at the end of a path.
            String searchPattern = "/" + decodedFileName;

            // 2. The repository now returns a List to handle all possibilities safely.
            List<Document> documents = documentRepository.findByRequestIdAndFilePathEndingWith(requestId, searchPattern);

            Document document;
            // 3. Handle the results from the database query.
            if (documents.isEmpty()) {
                // Case 1: No document found.
                logger.error("DATABASE LOOKUP FAILED: Document '{}' not found for request ID {}", decodedFileName, requestId);
                throw new EntityNotFoundException("Document not found: " + decodedFileName);
            } else if (documents.size() > 1) {
                // Case 2: More than one document found (indicates a data integrity issue).
                logger.warn("DATA INTEGRITY WARNING: Found {} documents for request ID {} with file name '{}'. Using the first result.", documents.size(), requestId, decodedFileName);
                // We will proceed with the first result but this should be investigated.
                document = documents.get(0);
            } else {
                // Case 3: Exactly one document found (the ideal case).
                document = documents.get(0);
            }

            String trustedFilePath = document.getFilePath();
            Resource resource = fileStorageService.loadFileAsResource(trustedFilePath);

            if (resource == null || !resource.exists() || !resource.isReadable()) {
                logger.error("FILE SYSTEM ERROR: Resource not found or unreadable at path: {}", trustedFilePath);
                return ResponseEntity.notFound().build();
            }

            String filenameFromResource = resource.getFilename();
            if (filenameFromResource == null || filenameFromResource.isBlank()) {
                filenameFromResource = decodedFileName;
            }

            String contentType = URLConnection.guessContentTypeFromName(filenameFromResource);
            if (contentType == null) {
                String lowerCaseFileName = filenameFromResource.toLowerCase();
                if (lowerCaseFileName.endsWith(".pdf")) {
                    contentType = "application/pdf";
                } else if (lowerCaseFileName.endsWith(".png")) {
                    contentType = "image/png";
                } else if (lowerCaseFileName.endsWith(".jpg") || lowerCaseFileName.endsWith(".jpeg")) {
                    contentType = "image/jpeg";
                } else {
                    contentType = "application/octet-stream";
                }
            }

            String dispositionType = "inline";
            String encodedFilename = URLEncoder.encode(filenameFromResource, StandardCharsets.UTF_8).replace("+", "%20");

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, dispositionType + "; filename*=UTF-8''" + encodedFilename)
                    .header("Access-Control-Expose-Headers", "Content-Disposition")
                    .body(resource);

        } catch (EntityNotFoundException e) {
            logger.warn("File access error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            logger.error("Unexpected error while serving file for request ID {}: {}", requestId, e.getMessage(), e);
            // Include the full stack trace for detailed debugging
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}