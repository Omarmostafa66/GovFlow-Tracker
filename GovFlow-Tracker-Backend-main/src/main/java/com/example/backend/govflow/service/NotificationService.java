package com.example.backend.govflow.service;

import com.example.backend.govflow.dto.NotificationDto;
import com.example.backend.govflow.entity.Notification;
import com.example.backend.govflow.entity.User;
import com.example.backend.govflow.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime; // ✅ إضافة استيراد LocalDateTime
import java.time.ZoneId;      // ✅ إضافة استيراد ZoneId
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional
    public void createNotificationForUser(User user, String title, String message) {
        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .isRead(false)
                .build();

        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> getNotificationsForUser(User user) {
        List<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user);
        // تحويل كل Notification Entity إلى NotificationDto
        return notifications.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    // ✅ START: الإضافة المطلوبة
    @Transactional
    public void markAllNotificationsAsRead(User user) {
        notificationRepository.markAllAsReadByUserId(user.getId());
    }

    @Transactional
    public void deleteNotification(Long notificationId, User user) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found with id: " + notificationId));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have permission to delete this notification.");
        }
        notificationRepository.delete(notification);
    }

    @Transactional
    public void clearAllNotifications(User user) {
        notificationRepository.deleteAllByUserId(user.getId());
    }
    // ✅ END: نهاية الإضافة

    // دالة مساعدة للتحويل من Entity إلى DTO
    private NotificationDto mapToDto(Notification notification) {
        return NotificationDto.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .read(notification.isRead()) // لاحظ استخدام isRead()
                // ✅ START: التعديل المطلوب
                // تحويل التاريخ من Instant إلى LocalDateTime باستخدام التوقيت المحلي
                .createdAt(LocalDateTime.ofInstant(notification.getCreatedAt(), ZoneId.of("Africa/Cairo")))
                // ✅ END: نهاية التعديل
                .build();
    }
}