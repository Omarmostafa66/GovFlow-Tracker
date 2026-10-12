package com.example.backend.govflow.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.OffsetDateTime;

@Entity
@Table(name = "documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Document {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    @JsonBackReference
    private ServiceRequest request;

    @Column(name = "document_type")
    private String documentType;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    // ✅ START: تم تعديل هذا السطر
    // تم حذف خاصية "updatable = false" للسماح بتحديث التاريخ من الكود
    @CreationTimestamp
    @Column(name = "uploaded_at")
    private OffsetDateTime uploadedAt;
    // ✅ END: نهاية التعديل

    // ملاحظة: بما أنك لا تريد تعديل قاعدة البيانات، لم أضف حقل حجم الملف
    // لكن تذكر أن حجم الملف سيظل 0 في الواجهة الأمامية
}