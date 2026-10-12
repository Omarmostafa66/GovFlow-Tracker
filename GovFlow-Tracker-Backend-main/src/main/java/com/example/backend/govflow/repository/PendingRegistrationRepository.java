package com.example.backend.govflow.repository;

import com.example.backend.govflow.entity.PendingRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PendingRegistrationRepository extends JpaRepository<PendingRegistration, Long> {

    Optional<PendingRegistration> findByVerificationToken(String token);

    Optional<PendingRegistration> findByEmail(String email);

    // ==========================================================
    // ✅ START: هذه هي الإضافة المطلوبة
    // (مطلوبة لإصلاح منطق التحقق في UserService.java)
    // ==========================================================
    Optional<PendingRegistration> findByNationalIdAndRole(String nationalId, String role);
    // ==========================================================
    // ✅ END: نهاية الإضافة
    // ==========================================================

    void deleteByTokenExpiryBefore(LocalDateTime now);
}