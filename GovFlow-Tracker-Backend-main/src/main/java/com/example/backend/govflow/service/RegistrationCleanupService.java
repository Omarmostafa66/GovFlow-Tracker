package com.example.backend.govflow.service;

import com.example.backend.govflow.repository.PendingRegistrationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class RegistrationCleanupService {

    private final PendingRegistrationRepository pendingRegistrationRepository;

    // This cron expression means "at the top of every hour"
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void cleanupExpiredRegistrations() {
        log.info("Running scheduled job to clean up expired pending registrations...");
        LocalDateTime now = LocalDateTime.now();
        pendingRegistrationRepository.deleteByTokenExpiryBefore(now);
        log.info("Cleanup job finished.");
    }
}