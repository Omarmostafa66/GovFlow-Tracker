//package com.example.backend.govflow.dto;
//
//import com.fasterxml.jackson.annotation.JsonInclude;
//import lombok.AllArgsConstructor;
//import lombok.Builder;
//import lombok.Data;
//import lombok.NoArgsConstructor;
//
//@Data
//@Builder
//@NoArgsConstructor
//@AllArgsConstructor
//// اترك هذه التعليمة لتجاهل الحقول الفارغة عند تحويلها لـ JSON
//@JsonInclude(JsonInclude.Include.NON_NULL)
//public class DashboardStatsDto {
//
//    // === هذه الحقول للـ Citizen/Department Dashboard ===
//    private String label; // (بدلاً من title في الكونستركتور)
//    private Integer count; // (بدلاً من value)
//    private String icon;
//    private String colorClass;
//
//    // === هذه الحقول للـ Employee Dashboard ===
//    // استخدم الأرقام الكبيرة (Objects) بدلاً من (primitives) لتكون null افتراضياً
//    private Long pending;
//    private Long underReview;
//    private Long approved;
//    private Long rejected;
//
//    // === هذا الكونستركتور الذي يحتاجه CitizenController ===
//    public DashboardStatsDto(String label, int count, String icon, String colorClass) {
//        this.label = label;
//        this.count = count;
//        this.icon = icon;
//        this.colorClass = colorClass;
//
//        // اترك الحقول الأخرى (pending, rejected...) كـ null
//    }
//}



package com.example.backend.govflow.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
// هذه التعليمة مهمة جداً: تتجاهل أي حقل قيمته null عند إرسال الـ JSON
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DashboardStatsDto {

    // === هذه الحقول للـ Citizen/Department Dashboard ===
    private String label; // (بدلاً من title في الكونستركتور)
    private Integer count; // (بدلاً من value)
    private String icon;
    private String colorClass;

    // === هذه الحقول للـ Employee Dashboard ===
    // نستخدم الأرقام الكبيرة (Objects) بدلاً من (primitives) لتقبل قيمة null
    private Long pending;
    private Long underReview;
    private Long approved;
    private Long rejected;

    // === هذا الكونستركتور الذي يحتاجه CitizenController ===
    public DashboardStatsDto(String label, int count, String icon, String colorClass) {
        this.label = label;
        this.count = count;
        this.icon = icon;
        this.colorClass = colorClass;
        // الحقول الأخرى (pending, rejected...) ستبقى null (وسيتم تجاهلها بفضل @JsonInclude)
    }

    // === هذا هو الكونستركتور المتبقي الذي يحتاجه EmployeeController ===
    public DashboardStatsDto(Long pending, Long underReview, Long approved, Long rejected) {
        this.pending = pending;
        this.underReview = underReview;
        this.approved = approved;
        this.rejected = rejected;
        // الحقول الأخرى (label, count...) ستبقى null (وسيتم تجاهلها)
    }
}