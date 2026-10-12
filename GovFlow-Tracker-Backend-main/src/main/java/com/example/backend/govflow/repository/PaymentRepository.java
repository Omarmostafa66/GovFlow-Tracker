package com.example.backend.govflow.repository;

import com.example.backend.govflow.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional; // ✅ START: إضافة Import جديد

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByRequest_Citizen_IdOrderByCreatedAtDesc(Long citizenId);

    List<Payment> findByRequest_Citizen_IdAndPaymentStatus(Long citizenId, String paymentStatus);

    // ✅ FIX: تم تعديل الدالة لتتجاهل حالة الأحرف (capital/small) لضمان النتيجة الصحيحة
    boolean existsByRequest_IdAndPaymentStatusIgnoreCase(Long requestId, String paymentStatus);

    // ==================================================================
    // ✅ START: إضافة الميثود الجديدة المطلوبة لجلب الدفعة الفعلية
    // ==================================================================
    /**
     * يبحث عن دفعة مكتملة باستخدام رقم الطلب (Request ID).
     * هذا ضروري للحصول على المبلغ الإجمالي "المدفوع فعلياً" (شامل الضريبة).
     */
    // السطر الصحيح
    Optional<Payment> findByRequest_IdAndPaymentStatusIgnoreCase(Long requestId, String status);
    // ==================================================================
    // ✅ END: نهاية الإضافة
    // ==================================================================
}