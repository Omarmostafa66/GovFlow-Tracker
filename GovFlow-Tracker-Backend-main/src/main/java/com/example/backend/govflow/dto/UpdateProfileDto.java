// src/main/java/com/example/backend/govflow/dto/UpdateProfileDto.java

package com.example.backend.govflow.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProfileDto {

    private String fullName;
    private String email;
    private String phoneNumber;
    private String address;
    private NotificationSettingsDto notifications;

    // كلاس داخلي لتمثيل إعدادات الإشعارات
    @Getter
    @Setter
    public static class NotificationSettingsDto {
        private boolean email;
        private boolean sms;
        private boolean marketing;
    }
}