package com.example.backend.govflow.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    /**
     * Stores a file associated with a specific request.
     * @param file The file to be stored.
     * @param requestId The ID of the service request.
     * @return The relative path of the stored file.
     */
    String storeFile(MultipartFile file, Long requestId);

    /**
     * Deletes a file from storage.
     * @param filePath The path of the file to delete.
     */
    void deleteFile(String filePath);

    /**
     * Loads a file as a Resource.
     * @param fileName The name of the file to load.
     * @return The Resource object for the file.
     */
    Resource loadFileAsResource(String fileName);
}