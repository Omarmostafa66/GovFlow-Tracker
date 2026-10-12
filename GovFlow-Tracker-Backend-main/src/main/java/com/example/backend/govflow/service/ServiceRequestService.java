package com.example.backend.govflow.service;

import com.example.backend.govflow.dto.*;
import com.example.backend.govflow.entity.*;
import com.example.backend.govflow.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServiceRequestService {

    private static final Logger logger = LoggerFactory.getLogger(ServiceRequestService.class);

    private final ServiceRequestRepository requestRepository;
    private final ServiceRepository serviceRepository;
    private final DocumentRepository documentRepository;
    private final FileStorageService fileStorageService;
    private final DepartmentRepository departmentRepository;
    private final PaymentRepository paymentRepository;
    private final RequestCommentRepository requestCommentRepository;
    private final EmployeeRepository employeeRepository;
    private final NotificationService notificationService;
    // ✅ START: Required injections for full notification logic
    private final UserRepository userRepository;
    private final ManagerRepository managerRepository;
    // ✅ END: Required injections

    @Transactional(readOnly = true)
    public EmployeeDashboardDto getEmployeeDashboardData(User employee) {
        Employee currentEmployee = employeeRepository.findByNationalId(employee.getNationalId())
                .orElseThrow(() -> new EntityNotFoundException("Employee details not found for the current user."));

        Long employeeId = currentEmployee.getId();

        long pendingCount = requestRepository.countByAssignedEmployeeIdAndStatus(employeeId, RequestStatus.PENDING_CITIZEN_ACTION);
        long underReviewCount = requestRepository.countByAssignedEmployeeIdAndStatus(employeeId, RequestStatus.UNDER_REVIEW);
        long approvedCount = requestRepository.countByAssignedEmployeeIdAndStatus(employeeId, RequestStatus.COMPLETED);
        long rejectedCount = requestRepository.countByAssignedEmployeeIdAndStatus(employeeId, RequestStatus.REJECTED);

        DashboardStatsDto stats = DashboardStatsDto.builder()
                .pending(pendingCount)
                .underReview(underReviewCount)
                .approved(approvedCount)
                .rejected(rejectedCount)
                .build();

        List<ServiceRequest> requests = requestRepository.findByAssignedEmployeeId(employeeId);
        List<EmployeeTaskDto> tasks = requests.stream()
                .map(EmployeeTaskDto::fromEntity)
                .collect(Collectors.toList());

        return EmployeeDashboardDto.builder()
                .stats(stats)
                .tasks(tasks)
                .build();
    }


    @Transactional
    public ServiceRequestDto createRequest(CreateServiceRequestDto dto, User citizen, List<MultipartFile> files) {
        Department department = departmentRepository.findByName(dto.getDepartment())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Department not found with name: " + dto.getDepartment()
                ));

        com.example.backend.govflow.entity.Service targetService =
                serviceRepository.findByNameAndDepartment(dto.getServiceName(), department)
                        .orElseThrow(() -> new EntityNotFoundException(
                                "Service '" + dto.getServiceName() + "' not found in department '" + dto.getDepartment() + "'. Please check names."
                        ));

        ServiceRequest request = ServiceRequest.builder()
                .serviceName(dto.getServiceName()).details(dto.getDetails())
                .department(dto.getDepartment()).citizen(citizen).service(targetService)
                .build();

        if (targetService.getBaseFee() != null && targetService.getBaseFee().compareTo(BigDecimal.ZERO) > 0) {
            request.setActualFee(targetService.getBaseFee());
            request.setStatus(RequestStatus.APPROVED_PENDING_PAYMENT);
        } else {
            request.setStatus(RequestStatus.SUBMITTED);
        }

        ServiceRequest savedRequest = requestRepository.save(request);

        String title = "Request Received Successfully";
        String message = "Your request for the service '" + savedRequest.getServiceName() + "' is now under review.";

        notificationService.createNotificationForUser(citizen, title, message);
        logger.info("Created a notification for user {} regarding new service request {}", citizen.getId(), savedRequest.getId());

        assignRequestToNextEmployee(savedRequest);

        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                String filePath = fileStorageService.storeFile(file, savedRequest.getId());
                Document document = new Document();
                document.setRequest(savedRequest);
                document.setFilePath(filePath);
                document.setDocumentType(file.getContentType());
                documentRepository.save(document);
            }
        }

        ServiceRequest freshRequest = requestRepository.findById(savedRequest.getId())
                .orElseThrow();
        return mapToDtoWithDocuments(freshRequest);
    }

    private void assignRequestToNextEmployee(ServiceRequest request) {
        com.example.backend.govflow.entity.Service parentService = request.getService();
        List<Employee> employees = employeeRepository.findByService(parentService);

        if (employees == null || employees.isEmpty()) {
            logger.warn("No employees found for service '{}'. Request {} will remain unassigned.", parentService.getName(), request.getId());
            return;
        }

        int nextEmployeeIndex = (parentService.getLastAssignedEmployeeIndex() + 1) % employees.size();
        Employee assignedEmployee = employees.get(nextEmployeeIndex);

        request.setAssignedEmployee(assignedEmployee);
        requestRepository.save(request);

        parentService.setLastAssignedEmployeeIndex(nextEmployeeIndex);
        serviceRepository.save(parentService);

        logger.info("Request {} assigned to employee {} using round-robin.", request.getId(), assignedEmployee.getEmployeeId());

        // ✅ START: THE REQUIRED MODIFICATION (Add Employee Notification)
        // Find the user account for the assigned employee and send a notification
        userRepository.findByNationalIdAndRole_Name(assignedEmployee.getNationalId(), "EMPLOYEE").ifPresent(employeeUser -> {
            String title = "New Task Assigned";
            String message = "You have been assigned a new service request: " + request.getServiceName();
            notificationService.createNotificationForUser(employeeUser, title, message);
            logger.info("Created a notification for assigned employee {} for request {}", employeeUser.getId(), request.getId());
        });
        // ✅ END: MODIFICATION COMPLETE
    }

    private ServiceRequestDto mapToDtoWithDocuments(ServiceRequest request) {
        List<DocumentDto> documentDtos = request.getDocuments() != null ?
                request.getDocuments().stream()
                        .map(doc -> {
                            String path = doc.getFilePath();
                            String fileName = path.contains("/") ? path.substring(path.lastIndexOf('/') + 1) : path;

                            return new DocumentDto(
                                    doc.getId(),
                                    fileName,
                                    doc.getDocumentType(),
                                    doc.getFilePath(),
                                    doc.getUploadedAt(),
                                    0L
                            );
                        })
                        .toList() :
                Collections.emptyList();

        boolean isPaidStatus = false;
        BigDecimal finalFeeAmount;

        Optional<Payment> completedPaymentOpt = paymentRepository.findByRequest_IdAndPaymentStatusIgnoreCase(request.getId(), "COMPLETED");

        if (completedPaymentOpt.isPresent()) {
            Payment completedPayment = completedPaymentOpt.get();
            isPaidStatus = true;
            finalFeeAmount = completedPayment.getAmount();
        } else {
            isPaidStatus = false;
            if (request.getActualFee() != null && request.getActualFee().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal baseFee = request.getActualFee();
                BigDecimal vatRate = new BigDecimal("0.14");
                BigDecimal vatAmount = baseFee.multiply(vatRate).setScale(2, RoundingMode.HALF_UP);
                finalFeeAmount = baseFee.add(vatAmount);
            } else {
                finalFeeAmount = BigDecimal.ZERO;
            }
        }

        List<RequestCommentDto> comments = requestCommentRepository.findByRequestId(request.getId())
                .stream()
                .map(comment -> new RequestCommentDto(
                        comment.getEmployee().getFullName(),
                        comment.getComment(),
                        comment.getCreatedAt()
                ))
                .toList();

        return new ServiceRequestDto(
                request.getId(),
                request.getServiceName(),
                request.getStatus().toString(),
                request.getSubmissionDate(),
                request.getDetails(),
                request.getDepartment(),
                request.getCitizen().getFullName(),
                documentDtos,
                request.getUpdatedAt(),
                finalFeeAmount.doubleValue(),
                request.getEmployeeComments(),
                comments,
                isPaidStatus
        );
    }

    @Transactional
    public Map<String, Object> uploadDocument(Long requestId, MultipartFile file, User currentUser) {
        ServiceRequest request = requestRepository.findByIdAndCitizenIdWithDocuments(requestId, currentUser.getId())
                .orElseThrow(() -> new EntityNotFoundException("Request not found or not owned by current user"));
        String filePath = fileStorageService.storeFile(file, request.getId());
        Document document = new Document();
        document.setRequest(request);
        document.setFilePath(filePath);
        document.setDocumentType(file.getContentType());
        Document savedDoc = documentRepository.save(document);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("id", savedDoc.getId());
        result.put("fileName", file.getOriginalFilename());
        result.put("filePath", savedDoc.getFilePath());
        return result;
    }

    @Transactional
    public DocumentDto replaceDocument(Long requestId, Long docId, MultipartFile file, User currentUser) {
        ServiceRequest request = requestRepository.findByIdAndCitizenIdWithDocuments(requestId, currentUser.getId())
                .orElseThrow(() -> new EntityNotFoundException("Request not found or not owned by current user"));

        Document document = documentRepository.findById(docId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found with id: " + docId));

        if (!document.getRequest().getId().equals(request.getId())) {
            throw new SecurityException("Document does not belong to the specified request.");
        }

        String oldFilePath = document.getFilePath();
        String newFilePath = fileStorageService.storeFile(file, request.getId());

        document.setFilePath(newFilePath);
        document.setDocumentType(file.getContentType());

        // ✅ START: This line was restored to update the time directly from the machine
        document.setUploadedAt(OffsetDateTime.now());
        // ✅ END: End of modification

        Document updatedDocument = documentRepository.save(document);

        fileStorageService.deleteFile(oldFilePath);
        logger.info("Successfully replaced document {} with new file {} for request {}", docId, newFilePath, requestId);

        String newFileName = newFilePath.contains("/") ? newFilePath.substring(newFilePath.lastIndexOf('/') + 1) : newFilePath;

        return new DocumentDto(
                updatedDocument.getId(),
                newFileName,
                updatedDocument.getDocumentType(),
                updatedDocument.getFilePath(),
                updatedDocument.getUploadedAt(),
                file.getSize()
        );
    }

    @Transactional(readOnly = true)
    public ServiceRequestDto getRequestForCitizenById(Long citizenId, Long requestId) {
        ServiceRequest request = requestRepository.findByIdAndCitizenIdWithDocuments(requestId, citizenId)
                .orElseThrow(() -> new EntityNotFoundException("Request not found with id: " + requestId));
        return mapToDtoWithDocuments(request);
    }

    @Transactional(readOnly = true)
    public List<ServiceRequestDto> getRequestsForCitizen(Long citizenId) {
        return requestRepository.findByCitizenIdWithDocuments(citizenId)
                .stream().map(this::mapToDtoWithDocuments).toList();
    }

    public List<ServiceRequestDto> getAllRequestsForDepartment(String department) {
        return requestRepository.findByDepartment(department)
                .stream().map(this::mapToDtoWithDocuments).toList();
    }

    public List<DashboardStatsDto> getDepartmentStats(String department) {
        // ✅ START: THE REQUIRED MODIFICATION (Corrected Status)
        // Using the correct status for pending requests
        long pendingCount = requestRepository.countByDepartmentAndStatus(department, RequestStatus.PENDING_CITIZEN_ACTION);
        // ✅ END: MODIFICATION COMPLETE
        long underReviewCount = requestRepository.countByDepartmentAndStatus(department, RequestStatus.UNDER_REVIEW);
        long approvedCount = requestRepository.countByDepartmentAndStatus(department, RequestStatus.COMPLETED);
        long rejectedCount = requestRepository.countByDepartmentAndStatus(department, RequestStatus.REJECTED);

        return Arrays.asList(
                new DashboardStatsDto("Pending", (int) pendingCount, "fas fa-clock", "pending"),
                new DashboardStatsDto("Under Review", (int) underReviewCount, "fas fa-eye", "review"),
                new DashboardStatsDto("Approved", (int) approvedCount, "fas fa-check", "approved"),
                new DashboardStatsDto("Rejected", (int) rejectedCount, "fas fa-times", "rejected")
        );
    }

    @Transactional(readOnly = true)
    public ServiceRequestDto getRequestDetailsById(Long requestId) {
        ServiceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new EntityNotFoundException("Request not found with id: " + requestId));
        return mapToDtoWithDocuments(request);
    }

    @Transactional
    public ServiceRequestDto reviewRequest(Long requestId, String newStatusStr, String comments) {
        ServiceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new EntityNotFoundException("Request not found with id: " + requestId));

        RequestStatus newStatus = RequestStatus.valueOf(newStatusStr.toUpperCase());

        request.setStatus(newStatus);
        request.setEmployeeComments(comments);

        ServiceRequest updatedRequest = requestRepository.save(request);

        // ✅ START: THE REQUIRED MODIFICATION (Add Manager Notification)
        // Notify the responsible manager about the status update
        managerRepository.findByService(request.getService()).ifPresent(manager -> {
            userRepository.findByNationalIdAndRole_Name(manager.getNationalId(), "MANAGER").ifPresent(managerUser -> {
                String employeeName = (request.getAssignedEmployee() != null) ? request.getAssignedEmployee().getFullName() : "System";
                String title = "Request Status Updated";
                String message = "Request for '" + request.getServiceName() + "' has been updated to '" + newStatus + "' by " + employeeName + ".";
                notificationService.createNotificationForUser(managerUser, title, message);
                logger.info("Created a notification for manager {} for request {}", managerUser.getId(), request.getId());
            });
        });
        // ✅ END: MODIFICATION COMPLETE

        return mapToDtoWithDocuments(updatedRequest);
    }

    public ReportDataDto getReportData() {
        List<ServiceRequest> allRequests = requestRepository.findAll();
        List<String> departments = allRequests.stream().map(ServiceRequest::getDepartment).distinct().toList();

        long total = allRequests.size();
        long approved = allRequests.stream().filter(r -> r.getStatus() == RequestStatus.COMPLETED).count();
        long rejected = allRequests.stream().filter(r -> r.getStatus() == RequestStatus.REJECTED).count();

        DecimalFormat df = new DecimalFormat("#.##");

        ReportStatsDto stats = new ReportStatsDto(
                new ReportStatValue(String.valueOf(total), 0.0),
                new ReportStatValue(String.valueOf(approved), 0.0),
                new ReportStatValue(String.valueOf(rejected), 0.0),
                new ReportStatValue(df.format(3.5), 0.0)
        );

        List<PerformanceMetricDto> metrics = departments.stream().map(dept -> {
            long deptTotal = requestRepository.countByDepartment(dept);
            long deptApproved = requestRepository.countByDepartmentAndStatus(dept, RequestStatus.COMPLETED);
            long deptRejected = requestRepository.countByDepartmentAndStatus(dept, RequestStatus.REJECTED);
            String approvalRate = (deptTotal > 0) ? df.format((double) deptApproved / deptTotal * 100) + "%" : "0%";
            return new PerformanceMetricDto(dept, (int) deptTotal, (int) deptApproved, (int) deptRejected, approvalRate, 4.1, "95%");
        }).toList();

        return new ReportDataDto(stats, metrics, new ArrayList<>());
    }

    @Transactional
    public void deleteDocument(Long requestId, Long docId, User currentUser) {
        ServiceRequest request = requestRepository.findByIdAndCitizenIdWithDocuments(requestId, currentUser.getId())
                .orElseThrow(() -> new EntityNotFoundException("Request not found or not owned by current user"));

        Document document = documentRepository.findById(docId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found with id: " + docId));

        if (!document.getRequest().getId().equals(request.getId())) {
            throw new EntityNotFoundException("Document does not belong to this request");
        }

        documentRepository.delete(document);
        fileStorageService.deleteFile(document.getFilePath());
    }

    public Resource loadDocument(String filePath) {
        return fileStorageService.loadFileAsResource(filePath);
    }
}