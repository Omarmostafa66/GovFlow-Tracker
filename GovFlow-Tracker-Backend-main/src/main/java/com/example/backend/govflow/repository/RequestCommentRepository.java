package com.example.backend.govflow.repository;

import com.example.backend.govflow.entity.RequestComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RequestCommentRepository extends JpaRepository<RequestComment, Long> {
    // ✅ FIX: تم تعريف الدالة بالاسم الصحيح الذي يستخدمه الـ Service
    List<RequestComment> findByRequestId(Long requestId);
}