package com.example.backend.govflow.service;

import com.example.backend.govflow.dto.*;
import com.example.backend.govflow.entity.*;
import com.example.backend.govflow.exception.PendingVerificationException;
import com.example.backend.govflow.exception.RegistrationException;
import com.example.backend.govflow.repository.*;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserService implements UserDetailsService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;
    private final ManagerRepository managerRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final PendingRegistrationRepository pendingRegistrationRepository;
    private final NotificationService notificationService;

    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;
    private Path fileStorageLocation;

    public UserService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       DepartmentRepository departmentRepository,
                       EmployeeRepository employeeRepository,
                       ManagerRepository managerRepository,
                       @Lazy PasswordEncoder passwordEncoder,
                       EmailService emailService,
                       PendingRegistrationRepository pendingRegistrationRepository,
                       NotificationService notificationService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.departmentRepository = departmentRepository;
        this.employeeRepository = employeeRepository;
        this.managerRepository = managerRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.pendingRegistrationRepository = pendingRegistrationRepository;
        this.notificationService = notificationService;
    }

    @PostConstruct
    public void init() {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directory for uploads.", ex);
        }
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        // --- START: تم حذف الإضافة المطلوبة ---
        // if (user.getDeletedAt() != null) {
        //     throw new DisabledException("تم تجميد حسابك. برجاء التواصل مع المدير المسؤول.");
        // }
        // --- END: نهاية الحذف ---

        return user;
    }

    public UserDetails loadUserByIdentifierAndRole(String identifier, String roleName) throws UsernameNotFoundException {
        String roleNameUpper = roleName.toUpperCase();
        Role role = roleRepository.findByName(roleNameUpper)
                .orElseThrow(() -> new UsernameNotFoundException("Invalid role specified for login."));

        User user;
        if ("CITIZEN".equals(roleNameUpper)) {
            user = userRepository.findByNationalIdAndRoleId(identifier, role.getId())
                    .orElseThrow(() -> new UsernameNotFoundException("User not found with National ID: " + identifier + " and role: " + roleName));
        } else {
            user = userRepository.findByEmailAndRoleId(identifier, role.getId())
                    .orElseThrow(() -> new UsernameNotFoundException("User not found with Email: " + identifier + " and role: " + roleName));
        }

        if (!user.isEnabled()) {
            throw new BadCredentialsException("Account is not verified. Please check your email.");
        }

        return user;
    }

    @Transactional
    public void register(RegisterRequest request) {
        String roleName = request.getRole().toUpperCase();
        Role userRole = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RegistrationException("Invalid role specified."));

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RegistrationException("Email already in use.");
        }

        if (userRepository.findByNationalIdAndRoleId(request.getNationalId(), userRole.getId()).isPresent()) {
            throw new RegistrationException("An account with this National ID and Role already exists.");
        }

        if ("EMPLOYEE".equals(roleName)) {
            checkEmployeeData(request);
        } else if ("MANAGER".equals(roleName)) {
            checkManagerData(request);
        }

        if (pendingRegistrationRepository.findByNationalIdAndRole(request.getNationalId(), roleName).isPresent()) {
            throw new PendingVerificationException("This account (National ID + Role) is already registered but not yet verified. Please check your email or resend the verification link.");
        }

        PendingRegistration pendingUser = new PendingRegistration();
        pendingUser.setFullName(request.getFullName());
        pendingUser.setNationalId(request.getNationalId());
        pendingUser.setEmail(request.getEmail());
        pendingUser.setPassword(passwordEncoder.encode(request.getPassword()));
        pendingUser.setPhoneNumber(request.getPhoneNumber());
        pendingUser.setAddress(request.getAddress());
        pendingUser.setRole(roleName);
        pendingUser.setJobRoleCode(request.getJobRoleCode());

        String token = UUID.randomUUID().toString();
        pendingUser.setVerificationToken(token);
        pendingUser.setTokenExpiry(LocalDateTime.now().plusHours(1));
        pendingUser.setCreatedAt(LocalDateTime.now());

        pendingRegistrationRepository.save(pendingUser);
        emailService.sendAccountVerificationEmail(pendingUser.getEmail(), token);
    }

    @Transactional
    public void updatePendingRegistration(RegisterRequest request) {
        String roleName = request.getRole().toUpperCase();
        PendingRegistration pendingUser = pendingRegistrationRepository.findByNationalIdAndRole(request.getNationalId(), roleName)
                .orElseThrow(() -> new RegistrationException("No pending registration found for this account (National ID + Role)."));

        if ("EMPLOYEE".equals(roleName)) {
            Employee employee = employeeRepository.findByNationalId(request.getNationalId())
                    .orElseThrow(() -> new RegistrationException("Employee data validation failed."));
            if (!employee.isRegistered() && !employee.getJobRoleCode().equals(request.getJobRoleCode())) {
                throw new RegistrationException("Job Role Code validation failed.");
            }
        } else if ("MANAGER".equals(roleName)) {
            Manager manager = managerRepository.findByNationalId(request.getNationalId())
                    .orElseThrow(() -> new RegistrationException("Manager data validation failed."));
            if (!manager.isRegistered() && !manager.getJobRoleCode().equals(request.getJobRoleCode())) {
                throw new RegistrationException("Job Role Code validation failed.");
            }
        }

        pendingUser.setEmail(request.getEmail());
        pendingUser.setFullName(request.getFullName());
        pendingUser.setNationalId(request.getNationalId());
        pendingUser.setPhoneNumber(request.getPhoneNumber());
        pendingUser.setAddress(request.getAddress());
        pendingUser.setRole(roleName);
        pendingUser.setJobRoleCode(request.getJobRoleCode());
        pendingUser.setPassword(passwordEncoder.encode(request.getPassword()));

        String token = UUID.randomUUID().toString();
        pendingUser.setVerificationToken(token);
        pendingUser.setTokenExpiry(LocalDateTime.now().plusHours(1));
        pendingUser.setResendAttempts(0);
        pendingUser.setLastResendRequestAt(null);

        pendingRegistrationRepository.save(pendingUser);
        emailService.sendAccountVerificationEmail(pendingUser.getEmail(), token);
    }

    @Transactional
    public User completeRegistration(String token) {
        logger.info("[DEBUG] Starting completeRegistration for token: {}", token);

        PendingRegistration pendingUser = pendingRegistrationRepository.findByVerificationToken(token)
                .orElseThrow(() -> {
                    logger.error("[DEBUG] Invalid token provided. No pending registration found.");
                    return new RegistrationException("Invalid or expired verification token.");
                });
        logger.info("[DEBUG] Found pending user: {}", pendingUser.getEmail());


        if (pendingUser.getTokenExpiry().isBefore(LocalDateTime.now())) {
            logger.warn("[DEBUG] Token for user {} has expired. Deleting pending registration.", pendingUser.getEmail());
            pendingRegistrationRepository.delete(pendingUser);
            throw new RegistrationException("Verification token has expired. Please register again.");
        }

        Role userRole = roleRepository.findByName(pendingUser.getRole())
                .orElseThrow(() -> new RegistrationException("Invalid role specified."));

        if (userRepository.findByEmailAndRoleId(pendingUser.getEmail(), userRole.getId()).isPresent() ||
                userRepository.findByNationalIdAndRoleId(pendingUser.getNationalId(), userRole.getId()).isPresent()) {
            logger.warn("[DEBUG] Account for user {} already activated or conflict exists. Deleting pending registration.", pendingUser.getEmail());
            pendingRegistrationRepository.delete(pendingUser);
            throw new RegistrationException("This account has already been activated or a conflict exists.");
        }

        User newUser = new User();
        newUser.setFullName(pendingUser.getFullName());
        newUser.setNationalId(pendingUser.getNationalId());
        newUser.setEmail(pendingUser.getEmail());
        newUser.setPassword(pendingUser.getPassword());
        newUser.setPhoneNumber(pendingUser.getPhoneNumber());
        newUser.setAddress(pendingUser.getAddress());
        newUser.setRole(userRole);
        newUser.setJobRoleCode(pendingUser.getJobRoleCode());
        newUser.setEnabled(true);

        String roleName = pendingUser.getRole().toUpperCase();
        if ("EMPLOYEE".equals(roleName) || "MANAGER".equals(roleName)) {
            String jobCode = pendingUser.getJobRoleCode();
            Department department;
            if (jobCode != null && (jobCode.contains("-TD-") || jobCode.contains("MGR-TD"))) {
                department = departmentRepository.findByName("Traffic Department")
                        .orElseThrow(() -> new RegistrationException("Configuration error: Traffic Department not found."));
            } else if (jobCode != null && (jobCode.contains("-LM-") || jobCode.contains("MGR-LM"))) {
                department = departmentRepository.findByName("Local Municipality")
                        .orElseThrow(() -> new RegistrationException("Configuration error: Local Municipality not found."));
            } else {
                throw new RegistrationException("Could not determine department from job role code.");
            }
            newUser.setDepartment(department);
        }

        User savedUser = userRepository.save(newUser);
        logger.info("[DEBUG] Successfully created new user in 'users' table with ID: {}", savedUser.getId());

        pendingRegistrationRepository.delete(pendingUser);
        logger.info("[DEBUG] Deleted pending registration for user: {}", pendingUser.getEmail());


        if ("EMPLOYEE".equals(roleName)) {
            logger.info("[DEBUG] Role is EMPLOYEE. Attempting to update 'employees' table for National ID: {}", pendingUser.getNationalId());
            Optional<Employee> employeeOpt = employeeRepository.findByNationalId(pendingUser.getNationalId());

            if (employeeOpt.isPresent()) {
                Employee employee = employeeOpt.get();
                logger.info("[DEBUG] Found employee record with ID: {}. Current isRegistered status: {}", employee.getId(), employee.isRegistered());

                if (!employee.isRegistered()) {
                    employee.setRegistered(true);
                    employeeRepository.save(employee);
                    logger.info("[DEBUG] SUCCESS: Employee record updated. isRegistered is now TRUE.");
                } else {
                    logger.warn("[DEBUG] Employee record was already marked as registered.");
                }
            } else {
                logger.error("[DEBUG] CRITICAL ERROR: Could not find employee record in 'employees' table for National ID: {}", pendingUser.getNationalId());
            }
        } else if ("MANAGER".equals(roleName)) {
            Manager manager = managerRepository.findByNationalId(pendingUser.getNationalId()).orElse(null);
            if (manager != null && !manager.isRegistered()) {
                manager.setRegistered(true);
                managerRepository.save(manager);
            }
        }

        return savedUser;
    }

    @Transactional
    public void resendVerificationLink(String email) {
        PendingRegistration pendingUser = pendingRegistrationRepository.findByEmail(email)
                .orElseThrow(() -> new RegistrationException("No pending registration found for this email."));

        final int MAX_ATTEMPTS = 2;
        final int COOLDOWN_MINUTES = 2;

        if (pendingUser.getResendAttempts() >= MAX_ATTEMPTS) {
            throw new RegistrationException("Maximum resend attempts reached (3 per hour). Please try again later.");
        }

        if (pendingUser.getLastResendRequestAt() != null &&
                ChronoUnit.MINUTES.between(pendingUser.getLastResendRequestAt(), LocalDateTime.now()) < COOLDOWN_MINUTES) {
            throw new RegistrationException("Please wait at least 2 minutes before trying again.");
        }

        String token = UUID.randomUUID().toString();
        pendingUser.setVerificationToken(token);
        pendingUser.setTokenExpiry(LocalDateTime.now().plusHours(1));
        pendingUser.setResendAttempts(pendingUser.getResendAttempts() + 1);
        pendingUser.setLastResendRequestAt(LocalDateTime.now());

        pendingRegistrationRepository.save(pendingUser);
        emailService.sendAccountVerificationEmail(pendingUser.getEmail(), token);
    }

    @Transactional
    public void initiatePasswordReset(String identifier) {
        Optional<User> userOptional = userRepository.findByEmail(identifier);
        if (userOptional.isEmpty()) {
            userOptional = userRepository.findFirstByNationalId(identifier);
        }

        User user = userOptional.orElseThrow(() ->
                new UsernameNotFoundException("No account found with the provided identifier.")
        );

        String token = UUID.randomUUID().toString();
        LocalDateTime expiryDate = LocalDateTime.now().plusMinutes(15);

        user.setResetPasswordToken(token);
        user.setResetTokenExpiry(expiryDate);
        userRepository.save(user);

        emailService.sendPasswordResetEmail(user.getEmail(), token);
    }

    @Transactional
    public void completePasswordReset(String token, String newPassword) {
        User user = userRepository.findByResetPasswordToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired password reset token."));

        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            user.setResetPasswordToken(null);
            user.setResetTokenExpiry(null);
            userRepository.save(user);
            throw new RuntimeException("Invalid or expired password reset token.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetPasswordToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }

    private void checkEmployeeData(RegisterRequest request) {
        Employee employee = employeeRepository.findByNationalId(request.getNationalId())
                .orElseThrow(() -> new RegistrationException("Employee data not found or invalid. Please check your National ID."));

        if (employee.getDeletedAt() != null) {
            throw new IllegalStateException("Registration is disabled for this account. Please contact your manager.");
        }

        if (employee.isRegistered()) {
            throw new RegistrationException("This employee account has already been registered and activated.");
        }

        if (!employee.getJobRoleCode().equals(request.getJobRoleCode())) {
            throw new RegistrationException("The entered Job Role Code is incorrect.");
        }
    }

    private void checkManagerData(RegisterRequest request) {
        Manager manager = managerRepository.findByNationalId(request.getNationalId())
                .orElseThrow(() -> new RegistrationException("Manager data not found or invalid. Please check your National ID."));

        if (manager.isRegistered()) {
            throw new RegistrationException("This manager account has already been registered and activated.");
        }

        if (!manager.getJobRoleCode().equals(request.getJobRoleCode())) {
            throw new RegistrationException("The entered Job Role Code is incorrect.");
        }
    }

    @Transactional
    public ProfileDto updateProfile(Long userId, UpdateProfileDto dto, MultipartFile avatarFile) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found."));

        user.setFullName(dto.getFullName());
        user.setEmail(dto.getEmail());
        user.setPhoneNumber(dto.getPhoneNumber());
        user.setAddress(dto.getAddress());

        if (avatarFile != null && !avatarFile.isEmpty()) {
            if (user.getAvatar() != null && !user.getAvatar().isEmpty()) {
                this.deleteFile(user.getAvatar());
            }
            String avatarUrl = this.storeFile(avatarFile, userId);
            user.setAvatar(avatarUrl);
        }

        User updatedUser = userRepository.save(user);

        String title = "Profile Updated Successfully";
        String message = "Your personal information has been updated.";
        notificationService.createNotificationForUser(updatedUser, title, message);
        logger.info("Created a profile update notification for user {}.", updatedUser.getId());

        return ProfileDto.fromEntity(updatedUser);
    }

    public void changePassword(Long userId, ChangePasswordDto dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found."));

        if (!passwordEncoder.matches(dto.getCurrentPassword(), user.getPassword())) {
            throw new BadCredentialsException("Incorrect current password.");
        }

        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void deleteAvatar(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found."));

        String existingAvatar = user.getAvatar();

        if (existingAvatar != null && !existingAvatar.isEmpty()) {
            this.deleteFile(existingAvatar);
            user.setAvatar(null);
            userRepository.save(user);
        }
    }

    private String storeFile(MultipartFile file, Long userId) {
        String originalFileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        try {
            if (originalFileName.contains("..")) {
                throw new RuntimeException("Filename contains invalid path sequence " + originalFileName);
            }
            String fileExtension = "";
            try {
                fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            } catch (Exception ignored) {}

            String newFileName = userId + "_" + System.currentTimeMillis() + fileExtension;
            Path targetLocation = this.fileStorageLocation.resolve(newFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return newFileName;
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + originalFileName, ex);
        }
    }

    private void deleteFile(String fileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            Files.deleteIfExists(filePath);
        } catch (IOException ex) {
            throw new RuntimeException("Could not delete file " + fileName, ex);
        }
    }

    public UserDto updateEmployee(Long userId, UpdateEmployeeDto dto) {
        User userToUpdate = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));

        Role newRole = roleRepository.findById(dto.getRoleId())
                .orElseThrow(() -> new EntityNotFoundException("Role not found with id: " + dto.getRoleId()));

        Department newDepartment = departmentRepository.findById(dto.getDepartmentId())
                .orElseThrow(() -> new EntityNotFoundException("Department not found with id: " + dto.getDepartmentId()));

        userToUpdate.setFullName(dto.getFullName());
        userToUpdate.setEmail(dto.getEmail());
        userToUpdate.setRole(newRole);
        userToUpdate.setDepartment(newDepartment);

        User updatedUser = userRepository.save(userToUpdate);

        return new UserDto(
                updatedUser.getId(),
                updatedUser.getFullName(),
                updatedUser.getEmail(),
                updatedUser.getNationalId(),
                updatedUser.getPhoneNumber(),
                updatedUser.getRole().getName(),
                updatedUser.getAvatar(),
                updatedUser.getJobRoleCode(),
                updatedUser.getDepartment() != null ? updatedUser.getDepartment().getName() : null,
                updatedUser.getAddress()
        );
    }

    public List<UserDto> findAllEmployees() {
        return userRepository.findAllByRoleNameNot("CITIZEN")
                .stream()
                .map(user -> new UserDto(
                        user.getId(),
                        user.getFullName(),
                        user.getEmail(),
                        user.getNationalId(),
                        user.getPhoneNumber(),
                        user.getRole().getName(),
                        user.getAvatar(),
                        user.getJobRoleCode(),
                        user.getDepartment() != null ? user.getDepartment().getName() : null,
                        user.getAddress()
                ))
                .collect(Collectors.toList());
    }

    public void deleteUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new EntityNotFoundException("User not found with id: " + userId);
        }
        userRepository.deleteById(userId);
    }
}