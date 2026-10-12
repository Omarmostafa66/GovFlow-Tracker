package com.example.backend.govflow.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
// ✅ START FIX: تم إضافة import
import java.time.OffsetDateTime;
// ✅ END FIX

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentDto {
    // ✅ START FIX: تم إعادة ترتيب الحقول وإضافة الحقول الناقصة
    private Long id;
    private String name;
    private String type;
    private String filePath;
    private OffsetDateTime uploadedAt;
    private long size;
    // ✅ END FIX
}