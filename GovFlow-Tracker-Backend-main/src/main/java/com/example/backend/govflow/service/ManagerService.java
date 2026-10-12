package com.example.backend.govflow.service;

import com.example.backend.govflow.dto.*;
import com.example.backend.govflow.entity.*;
import com.example.backend.govflow.exception.RegistrationException;
import com.example.backend.govflow.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ManagerService {

    private final ManagerRepository managerRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final ServiceRepository serviceRepository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final RoleRepository roleRepository;


    // =================================================================================
    // START: ✅ تم تعديل هذه الدالة بالكامل لحل مشكلة NaN
    // =================================================================================
    public ManagerDashboardDto getDashboardStats(User currentUser) {
        // الخطوة 1: جلب بيانات المدير بناءً على المستخدم الحالي
        Manager manager = getManagerProfile(currentUser);
        String scope;
        List<Employee> managedEmployees;

        // الخطوة 2: تحديد نطاق صلاحيات المدير (قسم كامل أم خدمة معينة) وجلب الموظفين التابعين له
        if (manager.getDepartment() != null) { // مدير قسم
            scope = "Department: " + manager.getDepartment().getName();
            List<Long> serviceIds = serviceRepository.findByDepartmentId(manager.getDepartment().getId())
                    .stream()
                    .map(com.example.backend.govflow.entity.Service::getId)
                    .collect(Collectors.toList());
            managedEmployees = serviceIds.isEmpty() ? Collections.emptyList() : employeeRepository.findByServiceIdIn(serviceIds);
        } else if (manager.getService() != null) { // مدير خدمة (كارت)
            scope = "Service: " + manager.getService().getName();
            managedEmployees = employeeRepository.findByServiceId(manager.getService().getId());
        } else {
            throw new IllegalStateException("Manager has no defined scope.");
        }

        // استخراج أرقام الموظفين (employee IDs) لاستخدامها في الاستعلامات
        List<Long> managedEmployeeIds = managedEmployees.stream().map(Employee::getId).collect(Collectors.toList());

        long totalTasks = 0;
        long approvedTasks = 0;
        long rejectedTasks = 0;
        long completedTasks = 0; // completed = approved
        List<ServiceTypeStatDto> serviceStats = Collections.emptyList();

        // الخطوة 3: حساب الإحصائيات فقط لو كان هناك موظفين
        if (!managedEmployeeIds.isEmpty()) {
            totalTasks = serviceRequestRepository.countByAssignedEmployeeIdIn(managedEmployeeIds);
            approvedTasks = serviceRequestRepository.countByAssignedEmployeeIdInAndStatus(managedEmployeeIds, RequestStatus.COMPLETED);
            rejectedTasks = serviceRequestRepository.countByAssignedEmployeeIdInAndStatus(managedEmployeeIds, RequestStatus.REJECTED);
            serviceStats = serviceRequestRepository.findServiceTypeStatsByEmployeeIds(managedEmployeeIds);
            completedTasks = approvedTasks; // نعتبر أن المكتمل هو المقبول
        }

        // الخطوة 4: حساب مقاييس الأداء لكل موظف على حدة
        List<EmployeePerformanceDto> performance = managedEmployees.stream().map(employee -> {
            List<ServiceRequest> employeeRequests = serviceRequestRepository.findByAssignedEmployeeId(employee.getId());
            long assigned = employeeRequests.size();
            long approved = employeeRequests.stream()
                    .filter(r -> r.getStatus() == RequestStatus.COMPLETED)
                    .count();
            long rejected = employeeRequests.stream()
                    .filter(r -> r.getStatus() == RequestStatus.REJECTED)
                    .count();
            long totalReviewed = approved + rejected;
            double approvalRate = (totalReviewed > 0) ? ((double) approved / totalReviewed) * 100 : 0.0;
            double avgProcessingTimeInDays = employeeRequests.stream()
                    .filter(r -> (r.getStatus() == RequestStatus.COMPLETED || r.getStatus() == RequestStatus.REJECTED)
                            && r.getSubmissionDate() != null && r.getUpdatedAt() != null)
                    .mapToLong(r -> ChronoUnit.DAYS.between(r.getSubmissionDate(), r.getUpdatedAt()))
                    .average()
                    .orElse(0.0);

            return new EmployeePerformanceDto(
                    employee.getFullName(),
                    employee.getJobRoleCode(),
                    assigned,
                    approved, // هنا نستخدم عدد المقبولين
                    avgProcessingTimeInDays,
                    approvalRate
            );
        }).collect(Collectors.toList());

        // الخطوة 5: بناء وإرسال الـ DTO بالبيانات الصحيحة
        return ManagerDashboardDto.builder()
                .managerScope(scope)
                .managedEmployeesCount(managedEmployees.size())
                .totalTasksInScope(totalTasks)
                .completedTasksInScope(completedTasks)
                .approvedTasksInScope(approvedTasks) // إرسال عدد الطلبات المقبولة
                .rejectedTasksInScope(rejectedTasks) // إرسال عدد الطلبات المرفوضة
                .employeePerformance(performance)
                .serviceTypeStats(serviceStats)
                .build();
    }
    // =================================================================================
    // END: ✅ نهاية التعديل
    // =================================================================================


    private Manager getManagerProfile(User currentUser) {
        return managerRepository.findByNationalId(currentUser.getNationalId())
                .orElseThrow(() -> new AccessDeniedException("User is not a recognized manager."));
    }

    @Transactional(readOnly = true)
    public List<ManagedEmployeeDto> getManagedEmployees(User currentUser) {
        Manager manager = getManagerProfile(currentUser);
        List<Long> managedServiceIds = getManagedServiceIds(manager);

        if (managedServiceIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<Employee> employees = employeeRepository.findByServiceIdIn(managedServiceIds);
        Role employeeRole = roleRepository.findByName("EMPLOYEE").orElse(null);

        return employees.stream().map(employee -> {
            Optional<User> userOpt = Optional.empty();
            if (employee.isRegistered() && employeeRole != null) {
                userOpt = userRepository.findByNationalIdAndRoleId(employee.getNationalId(), employeeRole.getId());
            }

            String email = userOpt.map(User::getEmail).orElse(null);
            String departmentName = Optional.ofNullable(employee.getService())
                    .map(com.example.backend.govflow.entity.Service::getDepartment)
                    .map(Department::getName)
                    .orElse("N/A");

            return new ManagedEmployeeDto(
                    employee.getId(),
                    employee.getFullName(),
                    email,
                    employee.getJobRoleCode(),
                    departmentName,
                    employee.isRegistered(),
                    employee.getDeletedAt()
            );
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ScopedReportDto getScopedReportData(User currentUser) {
        Manager manager = getManagerProfile(currentUser);
        String managerScope;

        if (manager.getDepartment() != null) {
            managerScope = "Overall Analytics for " + manager.getDepartment().getName();
        } else if (manager.getService() != null) {
            managerScope = "Analytics for Service: " + manager.getService().getName();
        } else {
            throw new IllegalStateException("Manager has no defined scope.");
        }

        List<Long> managedServiceIds = getManagedServiceIds(manager);

        if (managedServiceIds.isEmpty()) {
            return new ScopedReportDto(createEmptyReportData(), managerScope);
        }

        List<ServiceRequest> requests = serviceRequestRepository.findByServiceIdIn(managedServiceIds);
        ReportDataDto reportData = calculateReportData(requests);

        return new ScopedReportDto(reportData, managerScope);
    }

    private ReportDataDto createEmptyReportData() {
        ReportStatsDto stats = new ReportStatsDto(
                new ReportStatValue("0", 0.0),
                new ReportStatValue("0", 0.0),
                new ReportStatValue("0", 0.0),
                new ReportStatValue("0.0", 0.0)
        );
        return new ReportDataDto(stats, new ArrayList<>(), new ArrayList<>());
    }

    private ReportDataDto calculateReportData(List<ServiceRequest> requests) {
        // Stats Calculation
        long total = requests.size();
        long approved = requests.stream().filter(r -> r.getStatus() == RequestStatus.COMPLETED).count();
        long rejected = requests.stream().filter(r -> r.getStatus() == RequestStatus.REJECTED).count();
        double avgTime = requests.stream()
                .filter(r -> r.getSubmissionDate() != null && r.getUpdatedAt() != null)
                .mapToLong(r -> ChronoUnit.DAYS.between(r.getSubmissionDate(), r.getUpdatedAt()))
                .average()
                .orElse(0.0);

        ReportStatsDto stats = new ReportStatsDto(
                new ReportStatValue(String.valueOf(total), 0.0),
                new ReportStatValue(String.valueOf(approved), 0.0),
                new ReportStatValue(String.valueOf(rejected), 0.0),
                new ReportStatValue(String.format("%.1f", avgTime), 0.0)
        );

        // Performance Metrics Calculation
        Map<String, List<ServiceRequest>> requestsByDept = requests.stream()
                .collect(Collectors.groupingBy(ServiceRequest::getDepartment));

        List<PerformanceMetricDto> metrics = requestsByDept.entrySet().stream().map(entry -> {
            String dept = entry.getKey();
            List<ServiceRequest> deptRequests = entry.getValue();
            long deptTotal = deptRequests.size();
            long deptApproved = deptRequests.stream().filter(r -> r.getStatus() == RequestStatus.COMPLETED).count();
            long deptRejected = deptRequests.stream().filter(r -> r.getStatus() == RequestStatus.REJECTED).count();
            double deptAvgTime = deptRequests.stream()
                    .filter(r -> r.getSubmissionDate() != null && r.getUpdatedAt() != null)
                    .mapToLong(r -> ChronoUnit.DAYS.between(r.getSubmissionDate(), r.getUpdatedAt()))
                    .average().orElse(0.0);
            double approvalRate = (deptTotal > 0) ? (double) deptApproved / deptTotal * 100 : 0.0;

            return new PerformanceMetricDto(dept, (int) deptTotal, (int) deptApproved, (int) deptRejected,
                    String.format("%.1f", approvalRate), deptAvgTime, "95.0"); // SLA Compliance is static for now
        }).collect(Collectors.toList());

        // Top Performers (simplified logic)
        List<TopPerformerDto> topPerformers = new ArrayList<>();

        return new ReportDataDto(stats, metrics, topPerformers);
    }

    @Transactional
    public UserDto createEmployee(User currentUser, CreateEmployeeRequestDto dto) {
        Manager manager = getManagerProfile(currentUser);

        if (manager.getService() == null) {
            throw new AccessDeniedException("Only Card/Service managers can add new employees.");
        }

        com.example.backend.govflow.entity.Service managedService = manager.getService();
        if (employeeRepository.existsByNationalId(dto.getNationalId())) {
            throw new RegistrationException("An employee with this National ID is already predefined.");
        }

        long currentEmployeeCount = employeeRepository.countByServiceId(managedService.getId());
        if (currentEmployeeCount >= managedService.getMaxEmployees()) {
            throw new RegistrationException("Cannot add more employees. The service has reached its maximum capacity.");
        }

        String newEmployeeId = generateNextEmployeeId(managedService, currentEmployeeCount + 1);

        Employee newEmployee = new Employee();
        newEmployee.setNationalId(dto.getNationalId());
        newEmployee.setFullName(dto.getFullName());
        newEmployee.setService(managedService);
        newEmployee.setEmployeeId(newEmployeeId);
        newEmployee.setJobRoleCode(newEmployeeId);
        newEmployee.setRegistered(false);

        employeeRepository.save(newEmployee);

        return new UserDto(null, dto.getFullName(), null, dto.getNationalId(), null, "EMPLOYEE", null, newEmployeeId, managedService.getDepartment().getName(), null);
    }

    @Transactional
    public void softDeleteEmployee(Long employeeId, User currentUser) {
        Employee employee = findAndVerifyEmployee(employeeId, currentUser);
        employee.setDeletedAt(OffsetDateTime.now());
        employeeRepository.save(employee);

        roleRepository.findByName("EMPLOYEE").ifPresent(employeeRole -> {
            userRepository.findByNationalIdAndRoleId(employee.getNationalId(), employeeRole.getId())
                    .ifPresent(userToDisable -> {
                        userToDisable.setEnabled(false);
                        userRepository.save(userToDisable);
                    });
        });
    }

    @Transactional
    public void restoreEmployee(Long employeeId, User currentUser) {
        Employee employee = findAndVerifyEmployee(employeeId, currentUser);
        employee.setDeletedAt(null);
        employeeRepository.save(employee);

        roleRepository.findByName("EMPLOYEE").ifPresent(employeeRole -> {
            userRepository.findByNationalIdAndRoleId(employee.getNationalId(), employeeRole.getId())
                    .ifPresent(userToEnable -> {
                        userToEnable.setEnabled(true);
                        userRepository.save(userToEnable);
                    });
        });

    }

    @Transactional(readOnly = true)
    public List<ServiceScopeDto> getManagedServicesForCurrentUser(User currentUser) {
        Manager manager = getManagerProfile(currentUser);
        List<com.example.backend.govflow.entity.Service> services;

        if (manager.getDepartment() != null) {
            services = serviceRepository.findByDepartmentId(manager.getDepartment().getId());
        } else if (manager.getService() != null) {
            services = List.of(manager.getService());
        } else {
            throw new IllegalStateException("Manager scope is not defined.");
        }
        return services.stream().map(this::mapServiceToServiceScopeDto).collect(Collectors.toList());
    }

    private String generateNextEmployeeId(com.example.backend.govflow.entity.Service service, long nextSerialNumber) {
        String departmentCode = service.getDepartment().getGovCode();
        String cardCode = service.getCardCode();
        String serial = String.format("%03d", nextSerialNumber);
        return String.format("EMP-%s-%s-%s", departmentCode, cardCode, serial);
    }

    private Employee findAndVerifyEmployee(Long employeeId, User currentUser) {
        Manager manager = getManagerProfile(currentUser);

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found with ID: " + employeeId));

        List<Long> managedServiceIds = getManagedServiceIds(manager);
        if (employee.getService() == null || !managedServiceIds.contains(employee.getService().getId())) {
            throw new AccessDeniedException("Manager does not have permission to modify this employee.");
        }
        return employee;
    }

    private List<Long> getManagedServiceIds(Manager manager) {
        if (manager.getDepartment() != null) {
            return serviceRepository.findByDepartmentId(manager.getDepartment().getId())
                    .stream()
                    .map(com.example.backend.govflow.entity.Service::getId)
                    .collect(Collectors.toList());
        } else if (manager.getService() != null) {
            return Collections.singletonList(manager.getService().getId());
        }
        return Collections.emptyList();
    }

    private UserDto mapUserToUserDto(User user) {
        String departmentName = Optional.ofNullable(user.getDepartment())
                .map(Department::getName)
                .orElse(null);

        return new UserDto(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getNationalId(),
                user.getPhoneNumber(),
                user.getRole().getName(),
                user.getAvatar(),
                user.getJobRoleCode(),
                departmentName,
                user.getAddress()
        );
    }

    private ServiceScopeDto mapServiceToServiceScopeDto(com.example.backend.govflow.entity.Service service) {
        DepartmentDto deptDto = new DepartmentDto(
                service.getDepartment().getId(),
                service.getDepartment().getName()
        );

        return new ServiceScopeDto(
                service.getId(),
                service.getName(),
                service.getCardCode(),
                deptDto
        );
    }
}