package com.example.backend.govflow.dto;

import com.example.backend.govflow.entity.RequestStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@NoArgsConstructor
//@AllArgsConstructor
public class ServiceRequestDto {
    private Long id;
    private String serviceName;
    private String status; // تم تغيير هذا من RequestStatus إلى String
    private OffsetDateTime submissionDate;
    private String details;
    private String department;
    private String citizenName;
    private List<DocumentDto> uploadedDocuments;
    private OffsetDateTime updatedAt; // ✅ الإضافة المطلوبة
    private Double fee; // ✅ الإضافة المطلوبة

    // ✅ START FIX: تم إضافة الحقول الناقصة لتتوافق مع قاعدة البيانات
    private String employeeComments;
    // ملاحظة: أنت تحتاج لإنشاء كلاس اسمه RequestCommentDto إذا لم يكن موجودًا
    private List<RequestCommentDto> comments;
    private boolean isPaid;
    // ✅ END FIX

    // مُنشئ إضافي للتوافق مع الكود الحالي
    public ServiceRequestDto(Long id, String serviceName, String status, OffsetDateTime submissionDate,
                             String details, String department, String citizenName, List<DocumentDto> uploadedDocuments) {
        this.id = id;
        this.serviceName = serviceName;
        this.status = status;
        this.submissionDate = submissionDate;
        this.details = details;
        this.department = department;
        this.citizenName = citizenName;
        this.uploadedDocuments = uploadedDocuments;
    }

    // ✅ مُنشئ إضافي جديد يتضمن الخصائص المضافة
    public ServiceRequestDto(Long id, String serviceName, String status, OffsetDateTime submissionDate,
                             String details, String department, String citizenName, List<DocumentDto> uploadedDocuments,
                             OffsetDateTime updatedAt, Double fee) {
        this.id = id;
        this.serviceName = serviceName;
        this.status = status;
        this.submissionDate = submissionDate;
        this.details = details;
        this.department = department;
        this.citizenName = citizenName;
        this.uploadedDocuments = uploadedDocuments;
        this.updatedAt = updatedAt;
        this.fee = fee;
    }

    // ✅ START FIX: تم إضافة Constructor جديد وشامل لكل الحقول
    public ServiceRequestDto(Long id, String serviceName, String status, OffsetDateTime submissionDate,
                             String details, String department, String citizenName,
                             List<DocumentDto> uploadedDocuments, OffsetDateTime updatedAt,
                             Double fee, String employeeComments, List<RequestCommentDto> comments,
                             boolean isPaid) {
        this.id = id;
        this.serviceName = serviceName;
        this.status = status;
        this.submissionDate = submissionDate;
        this.details = details;
        this.department = department;
        this.citizenName = citizenName;
        this.uploadedDocuments = uploadedDocuments;
        this.updatedAt = updatedAt;
        this.fee = fee;
        this.employeeComments = employeeComments;
        this.comments = comments;
        this.isPaid = isPaid;
    }
    // ✅ END FIX
}