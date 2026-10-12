package com.example.backend.govflow.security;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
// ✍️ تم حذف import org.springframework.stereotype.Component;

/**
 * ✍️ هذا الكلاس هو المسؤول عن قراءة إعدادات تخزين الملفات
 * من ملف application.yaml.
 */
// ✅ START: تم حذف هذا السطر لحل مشكلة الـ autowiring
// @Component // ✍️ تجعل هذا الكلاس Bean يتم إدارته بواسطة Spring.
// ✅ END: نهاية التعديل
@ConfigurationProperties(prefix = "file") // ✍️ تربط هذا الكلاس مع أي إعدادات تبدأ بـ "file" في application.yaml.
@Getter
@Setter
public class FileStorageProperties {
    /**
     * ✍️ سيتم تخزين قيمة 'file.upload-dir' من ملف application.yaml
     * في هذا المتغير تلقائيًا.
     */
    private String uploadDir;
}