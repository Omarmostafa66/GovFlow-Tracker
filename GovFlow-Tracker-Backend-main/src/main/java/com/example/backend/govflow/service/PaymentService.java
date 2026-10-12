package com.example.backend.govflow.service;

import com.example.backend.govflow.dto.CitizenPaymentSummaryDto;
import com.example.backend.govflow.dto.PayableServiceDto;
import com.example.backend.govflow.dto.PaymentRecordDto;
import com.example.backend.govflow.dto.ProcessPaymentDto;
import com.example.backend.govflow.entity.Payment;
import com.example.backend.govflow.entity.RequestStatus;
import com.example.backend.govflow.entity.ServiceRequest;
import com.example.backend.govflow.entity.User;
import com.example.backend.govflow.repository.PaymentRepository;
import com.example.backend.govflow.repository.ServiceRequestRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger; // ✅ Required import
import org.slf4j.LoggerFactory; // ✅ Required import
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentService.class); // ✅ Added logger
    private final PaymentRepository paymentRepository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final NotificationService notificationService; // ✅ Required injection for notifications

    public List<PayableServiceDto> getPayableServicesForUser(User user) {
        return serviceRequestRepository.findByCitizenIdAndStatus(user.getId(), RequestStatus.APPROVED_PENDING_PAYMENT)
                .stream()
                .map(req -> new PayableServiceDto(req.getId(), req.getServiceName(), req.getActualFee()))
                .collect(Collectors.toList());
    }

    public List<PaymentRecordDto> getPaymentHistoryForUser(User user) {
        return paymentRepository.findByRequest_Citizen_IdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(payment -> new PaymentRecordDto(
                        payment.getId(),
                        payment.getRequest().getServiceName(),
                        payment.getAmount(),
                        payment.getCreatedAt().toLocalDate(),
                        payment.getPaymentStatus(),
                        // ==================================================================
                        // ✅ START: Required addition to pass the invoice number
                        // ==================================================================
                        payment.getInvoiceNumber()
                        // ==================================================================
                        // ✅ END: End of addition
                        // ==================================================================
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public Payment processPayment(ProcessPaymentDto paymentDto, User currentUser) {
        ServiceRequest serviceRequest = serviceRequestRepository.findById(paymentDto.getServiceRequestId())
                .orElseThrow(() -> new EntityNotFoundException("ServiceRequest not found with id: " + paymentDto.getServiceRequestId()));

        if (!serviceRequest.getCitizen().getId().equals(currentUser.getId())) {
            throw new SecurityException("User is not authorized to pay for this request.");
        }

        if (serviceRequest.getStatus() != RequestStatus.APPROVED_PENDING_PAYMENT) {
            throw new IllegalStateException("This service request is not in a payable state. Current status: " + serviceRequest.getStatus());
        }

        // ==================================================================
        // ✅ START: Fee calculation modified to include 14% VAT
        // ==================================================================
        BigDecimal baseFee = serviceRequest.getActualFee(); // Base fee
        BigDecimal vatRate = new BigDecimal("0.14"); // 14% rate
        // Using setScale for correct currency rounding
        BigDecimal vatAmount = baseFee.multiply(vatRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = baseFee.add(vatAmount); // Total amount

        Payment newPayment = new Payment();
        newPayment.setRequest(serviceRequest);
        newPayment.setAmount(totalAmount); // ✅ FIX: The total amount (Base + 14%) is saved
        newPayment.setPaymentStatus("COMPLETED");
        // ==================================================================
        // ✅ END: End of fee calculation modification
        // ==================================================================


        // ==================================================================
        // ✅ START: Required addition to generate invoice data
        // ==================================================================
        String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomPart = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        newPayment.setInvoiceNumber("INV-" + datePart + "-" + randomPart);
        newPayment.setInvoiceDate(LocalDateTime.now());
        // ==================================================================
        // ✅ END: End of addition
        // ==================================================================

        Payment savedPayment = paymentRepository.save(newPayment);

        serviceRequest.setStatus(RequestStatus.IN_PROGRESS);
        serviceRequestRepository.save(serviceRequest);

        // ==========================================================
        // ✅ START: THE REQUIRED MODIFICATION (Add Notification Logic)
        // ==========================================================
        String title = "Payment Successful";
        String message = "Your payment of " + savedPayment.getAmount() + " for the service '" + serviceRequest.getServiceName() + "' was successful. Your request is now being processed.";
        notificationService.createNotificationForUser(currentUser, title, message);
        logger.info("Created a payment success notification for user {}.", currentUser.getId());
        // ==========================================================
        // ✅ END: MODIFICATION COMPLETE
        // ==========================================================

        return savedPayment;
    }

    // ==================================================================
    // ✅ START: New function to calculate citizen payment summary
    // ==================================================================
    public CitizenPaymentSummaryDto getCitizenPaymentSummary(User currentUser) {
        // Calculate total of completed payments (this now contains the total + 14% because we save the total)
        BigDecimal totalReceived = paymentRepository.findByRequest_Citizen_IdAndPaymentStatus(currentUser.getId(), "COMPLETED")
                .stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Calculate total of pending payments (services awaiting payment)
        // (Note: This shows the base fee only, not the expected total. This is the correct behavior for the summary)
        BigDecimal totalPending = serviceRequestRepository.findByCitizenIdAndStatus(currentUser.getId(), RequestStatus.APPROVED_PENDING_PAYMENT)
                .stream()
                .map(ServiceRequest::getActualFee)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new CitizenPaymentSummaryDto(totalReceived, totalPending);
    }
    // ==================================================================
    // ✅ END: End of added function
    // ==================================================================
}