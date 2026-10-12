package com.example.backend.govflow.controller;

import com.example.backend.govflow.dto.CitizenPaymentSummaryDto; // ✅ Import DTO
import com.example.backend.govflow.dto.PayableServiceDto;
import com.example.backend.govflow.dto.PaymentRecordDto;
import com.example.backend.govflow.dto.ProcessPaymentDto;
import com.example.backend.govflow.entity.Payment;
import com.example.backend.govflow.entity.User;
import com.example.backend.govflow.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/payments") // 👈 هذا هو السطر الوحيد الذي تم تعديله
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping("/payable")
    public ResponseEntity<List<PayableServiceDto>> getPayableServices(@AuthenticationPrincipal User currentUser) {
        List<PayableServiceDto> services = paymentService.getPayableServicesForUser(currentUser);
        return ResponseEntity.ok(services);
    }

    @GetMapping("/history")
    public ResponseEntity<List<PaymentRecordDto>> getPaymentHistory(@AuthenticationPrincipal User currentUser) {
        List<PaymentRecordDto> history = paymentService.getPaymentHistoryForUser(currentUser);
        return ResponseEntity.ok(history);
    }

    // ==================================================================
    // ✅ START: إضافة الـ Endpoint الناقص لملخص المدفوعات
    // ==================================================================
    @GetMapping("/summary")
    public ResponseEntity<CitizenPaymentSummaryDto> getCitizenPaymentSummary(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(paymentService.getCitizenPaymentSummary(currentUser));
    }
    // ==================================================================
    // ✅ END: نهاية الإضافة
    // ==================================================================


    // ==================================================================
    // 🔄 START: تعديل دالة الدفع لترجع DTO بدلاً من Entity
    // ==================================================================
    @PostMapping("/process")
    public ResponseEntity<?> processPayment(
            @RequestBody ProcessPaymentDto paymentDto,
            @AuthenticationPrincipal User currentUser) {
        try {
            Payment savedPayment = paymentService.processPayment(paymentDto, currentUser);

            // التحويل من Entity إلى DTO قبل إرسال الرد
            PaymentRecordDto responseDto = new PaymentRecordDto(
                    savedPayment.getId(),
                    savedPayment.getRequest().getServiceName(),
                    savedPayment.getAmount(),
                    savedPayment.getCreatedAt().toLocalDate(),
                    savedPayment.getPaymentStatus(),
                    // ==================================================================
                    // ✅ START: تم إضافة الوسيط السادس الناقص هنا لحل المشكلة
                    // ==================================================================
                    savedPayment.getInvoiceNumber()
                    // ==================================================================
                    // ✅ END: نهاية الإضافة
                    // ==================================================================
            );

            return ResponseEntity.ok(responseDto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    // ==================================================================
    // 🔄 END: نهاية التعديل
    // ==================================================================
}