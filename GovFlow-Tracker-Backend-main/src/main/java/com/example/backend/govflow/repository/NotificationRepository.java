package com.example.backend.govflow.repository;

import com.example.backend.govflow.entity.Notification;
import com.example.backend.govflow.entity.User; // ✅ إضافة استيراد كلاس User
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    // دالة لجلب كل إشعارات مستخدم معين، مرتبة من الأحدث للأقدم
    // ✅ التعديل: البحث باستخدام كائن User بدلاً من Long userId
    List<Notification> findByUserOrderByCreatedAtDesc(User user);

    // ✅ START: الإضافة المطلوبة
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user.id = :userId")
    void markAllAsReadByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.user.id = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);
    // ✅ END: نهاية الإضافة
}