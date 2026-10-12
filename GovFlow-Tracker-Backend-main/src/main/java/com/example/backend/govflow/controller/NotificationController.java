package com.example.backend.govflow.controller;

import com.example.backend.govflow.dto.NotificationDto;
import com.example.backend.govflow.entity.User;
import com.example.backend.govflow.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationDto>> getMyNotifications(@AuthenticationPrincipal User currentUser) {
        // ✅ START: التعديل المطلوب
        // تم تغيير currentUser.getId() إلى currentUser ليتوافق مع نوع الباراميتر المطلوب
        List<NotificationDto> notifications = notificationService.getNotificationsForUser(currentUser);
        // ✅ END: نهاية التعديل
        return ResponseEntity.ok(notifications);
    }

    // ✅ START: الإضافة المطلوبة
    @PostMapping("/mark-all-as-read")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal User user) {
        notificationService.markAllNotificationsAsRead(user);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id, @AuthenticationPrincipal User user) {
        notificationService.deleteNotification(id, user);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/clear-all")
    public ResponseEntity<Void> clearAllNotifications(@AuthenticationPrincipal User user) {
        notificationService.clearAllNotifications(user);
        return ResponseEntity.noContent().build();
    }
    // ✅ END: نهاية الإضافة
}