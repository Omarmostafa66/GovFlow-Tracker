package com.example.backend.govflow.dto;

import com.example.backend.govflow.entity.ServiceRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder // ✅ 1. تم إعادة إضافة Builder annotation
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeTaskDto {
    private String id;
    private String serviceType;
    private String citizenName;
    private OffsetDateTime submittedDate;
    private String status;
    private String priority; // ✅ 2. تمت إعادة إضافة حقل الأولوية

    /**
     * دالة مساعدة لتحويل كائن ServiceRequest إلى EmployeeTaskDto.
     * @param request كائن الطلب من قاعدة البيانات.
     * @return كائن DTO جاهز للإرسال للواجهة الأمامية.
     */
    public static EmployeeTaskDto fromEntity(ServiceRequest request) {
        if (request == null) {
            return null;
        }
        // ✅ 3. تم تحديث الدالة لاستخدام الـ Builder
        return EmployeeTaskDto.builder()
                .id("TSK-" + String.format("%03d", request.getId()))
                .serviceType(request.getServiceName())
                .citizenName(request.getCitizen().getFullName())
                .submittedDate(request.getSubmissionDate())
                .status(request.getStatus().name())
                .priority("Normal") // قيمة افتراضية للأولوية
                .build();
    }
}

