package com.example.backend.govflow.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeePerformanceDto {
    private String employeeName;
    private String employeeId; // The user's job role code from the users table
    private long assignedTasks;
    private long completedTasks;

    // ==========================================================
    // START: ✅ التعديل المطلوب لإضافة حقول الأداء
    // ==========================================================

    /**
     * متوسط الوقت المستغرق لإنجاز الطلب (بالأيام).
     */
    private double avgProcessingTimeInDays;

    /**
     * نسبة الطلبات التي تم قبولها من إجمالي الطلبات المكتملة (المقبولة والمرفوضة).
     */
    private double approvalRate;

    // ==========================================================
    // END: ✅ نهاية التعديل
    // ==========================================================
}