package com.example.backend.govflow.security;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {

        // 1. تحديد المسار الذي سيراه المتصفح في الرابط
        //    مثال: http://localhost:8080/uploads/filename.jpg
        String resourcePathPattern = "/uploads/**";

        // 2. تحديد المسار الفعلي للمجلد على السيرفر
        //    هذا الكود يحدد أن مجلد "uploads" موجود في نفس مكان تشغيل المشروع
        Path uploadsDirectory = Paths.get("uploads");
        String absoluteUploadsPath = uploadsDirectory.toFile().getAbsolutePath();
        String resourceLocation = "file:/" + absoluteUploadsPath + "/";

        // 3. ربط مسار الرابط بالمسار الفعلي على السيرفر
        registry.addResourceHandler(resourcePathPattern)
                .addResourceLocations(resourceLocation);
    }
}