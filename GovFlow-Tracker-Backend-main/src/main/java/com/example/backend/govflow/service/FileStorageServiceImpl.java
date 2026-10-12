package com.example.backend.govflow.service;

import com.example.backend.govflow.security.FileStorageProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;

@Service
public class FileStorageServiceImpl implements FileStorageService {

    private final Path rootStorageLocation;

    @Autowired
    public FileStorageServiceImpl(FileStorageProperties properties) {
        this.rootStorageLocation = Paths.get(properties.getUploadDir())
                .toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.rootStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the upload directory specified in configuration.", ex);
        }
    }

    @Override
    public String storeFile(MultipartFile file, Long requestId) {
        String originalFileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));

        try {
            if (originalFileName.contains("..")) {
                throw new RuntimeException("Sorry! The filename contains an invalid path sequence: " + originalFileName);
            }

            // Create a subdirectory for the request if it doesn't exist
            Path requestDirectory = this.rootStorageLocation.resolve(String.valueOf(requestId));
            Files.createDirectories(requestDirectory);

            // Resolve the final file path within the subdirectory
            Path targetLocation = requestDirectory.resolve(originalFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // Return the relative path (e.g., "101/document.pdf")
            return Paths.get(String.valueOf(requestId), originalFileName).toString().replace("\\", "/");

        } catch (IOException ex) {
            throw new RuntimeException("Failed to store file " + originalFileName, ex);
        }
    }

    @Override
    public void deleteFile(String filePath) {
        try {
            if (filePath != null && !filePath.isEmpty()) {
                Path targetPath = this.rootStorageLocation.resolve(filePath).normalize();
                if (Files.exists(targetPath)) {
                    Files.delete(targetPath);
                }
            }
        } catch (IOException ex) {
            throw new RuntimeException("Failed to delete file " + filePath, ex);
        }
    }

    @Override
    public Resource loadFileAsResource(String fileName) {
        try {
            Path filePath = this.rootStorageLocation.resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                // Return null if resource is not found or not readable
                // The controller will then handle this as a 404 error.
                return null;
            }
        } catch (MalformedURLException ex) {
            // Also return null for malformed URLs
            return null;
        }
    }
}