//package com.example.backend.govflow.service;
//
//import com.example.backend.govflow.dto.CreateEmployeeRequestDto;
//import com.example.backend.govflow.dto.UserDto;
//import com.example.backend.govflow.entity.Department;
//import com.example.backend.govflow.entity.Employee;
//import com.example.backend.govflow.entity.Role;
//import com.example.backend.govflow.entity.Service;
//import com.example.backend.govflow.entity.User;
//import com.example.backend.govflow.exception.RegistrationException;
//import com.example.backend.govflow.exception.ServiceCapacityExceededException;
//import com.example.backend.govflow.repository.EmployeeRepository;
//import com.example.backend.govflow.repository.RoleRepository;
//import com.example.backend.govflow.repository.ServiceRepository;
//import com.example.backend.govflow.repository.UserRepository;
//import jakarta.persistence.EntityNotFoundException;
//import lombok.RequiredArgsConstructor;
//import org.springframework.security.crypto.password.PasswordEncoder;
//import org.springframework.transaction.annotation.Transactional;
//
//import java.util.Optional;
//
//@org.springframework.stereotype.Service
//@RequiredArgsConstructor
//public class EmployeeService {
//
//    private final EmployeeRepository employeeRepository;
//    private final ServiceRepository serviceRepository;
//    private final UserRepository userRepository;
//    private final PasswordEncoder passwordEncoder;
//    private final RoleRepository roleRepository;
//
//
//    @Transactional
//    public UserDto createEmployeeUnderManager(CreateEmployeeRequestDto dto) {
//        Role employeeRole = roleRepository.findByName("EMPLOYEE")
//                .orElseThrow(() -> new IllegalStateException("Role EMPLOYEE not found"));
//
//        if (userRepository.existsByNationalIdAndRoleId(dto.getNationalId(), employeeRole.getId())) {
//            throw new RegistrationException("A user with this National ID is already registered as an employee.");
//        }
////        if (userRepository.existsByEmail(dto.getEmail())) {
////            throw new RegistrationException("This email is already in use.");
////        }
//
//        Service service = serviceRepository.findById(dto.getServiceId())
//                .orElseThrow(() -> new IllegalArgumentException("Invalid Service ID: " + dto.getServiceId()));
//
//        long sequence = employeeRepository.countByServiceId(service.getId()) + 1;
//        String formattedSequence = String.format("%03d", sequence);
//        String employeeId = String.format("EMP-%s-%s-%s",
//                service.getDepartment().getGovCode(),
//                service.getCardCode(),
//                formattedSequence);
//
//        User newUser = new User();
//        newUser.setFullName(dto.getFullName());
//        newUser.setNationalId(dto.getNationalId());
////        newUser.setEmail(dto.getEmail());
////        newUser.setPassword(passwordEncoder.encode(dto.getPassword()));
//        newUser.setRole(employeeRole);
//        newUser.setDepartment(service.getDepartment());
//        newUser.setJobRoleCode(employeeId);
//        newUser.setEnabled(true);
//
//        User savedUser = userRepository.save(newUser);
//
//        return mapUserToUserDto(savedUser);
//    }
//
//
//    /**
//     * ✅ تم تعديل هذه الدالة لتطابق منطق العمل المطلوب
//     * الآن، تقوم هذه الدالة بإنشاء سجل في جدول 'employees' فقط، تمامًا كما في الصورة.
//     * @param employeeDto بيانات الموظف الجديد.
//     * @return الموظف الذي تم إنشاؤه وحفظه في جدول 'employees'.
//     */
//    public Employee createEmployee(CreateEmployeeRequestDto employeeDto) {
//        // 1. التحقق من أن الرقم القومي غير مسجل من قبل في جدول الموظفين
//        employeeRepository.findByNationalId(employeeDto.getNationalId()).ifPresent(e -> {
//            throw new RegistrationException("Employee with national ID " + employeeDto.getNationalId() + " already exists.");
//        });
//
//        // 2. البحث عن الخدمة والتأكد من وجودها
//        Service service = serviceRepository.findById(employeeDto.getServiceId())
//                .orElseThrow(() -> new EntityNotFoundException("Service with ID " + employeeDto.getServiceId() + " not found."));
//
//        // 3. التحقق من سعة الخدمة (هل هناك مكان لموظف جديد؟)
//        long currentEmployeeCount = employeeRepository.countByService(service);
//        if (currentEmployeeCount >= service.getMaxEmployees()) {
//            throw new ServiceCapacityExceededException("Service '" + service.getName() + "' has reached its maximum capacity of " + service.getMaxEmployees() + " employees.");
//        }
//
//        // 4. توليد كود الموظف المميز
//        String employeeId = generateEmployeeId(service, currentEmployeeCount);
//
//        // 5. إنشاء كائن الموظف الجديد
//        Employee newEmployee = new Employee();
//        newEmployee.setNationalId(employeeDto.getNationalId());
//        newEmployee.setFullName(employeeDto.getFullName());
//        newEmployee.setJobRoleCode(employeeId); // استخدام الكود الذي تم توليده
//        newEmployee.setService(service); // ربط الموظف بالخدمة
//        newEmployee.setEmployeeId(employeeId); // تعيين الكود المميز
//        newEmployee.setRegistered(false); // القيمة الافتراضية تكون false لأنه لم يكمل التسجيل بعد
//
//        // 6. حفظ الموظف في جدول 'employees' وإرجاعه
//        return employeeRepository.save(newEmployee);
//    }
//
//    private String generateEmployeeId(Service service, long currentCount) {
//        // الجزء الأول: ثابت "EMP"
//        String prefix = "EMP";
//
//        // الجزء الثاني: كود الجهة الحكومية من الـ Department
//        String govCode = service.getDepartment().getGovCode();
//
//        // الجزء الثالث: كود الخدمة/الكارت
//        String cardCode = service.getCardCode();
//
//        // الجزء الرابع: الرقم التسلسلي للموظف الجديد
//        long serialNumber = currentCount + 1;
//        // تنسيق الرقم ليكون دائماً من 3 خانات مع أصفار بادئة (e.g., 5 -> "005")
//        String formattedSerialNumber = String.format("%03d", serialNumber);
//
//        return String.format("%s-%s-%s-%s", prefix, govCode, cardCode, formattedSerialNumber);
//    }
//
//    private UserDto mapUserToUserDto(User user) {
//        String departmentName = Optional.ofNullable(user.getDepartment())
//                .map(Department::getName)
//                .orElse(null);
//
//        return new UserDto(
//                user.getId(),
//                user.getFullName(),
//                user.getEmail(),
//                user.getNationalId(),
//                user.getPhoneNumber(),
//                user.getRole().getName(),
//                user.getAvatar(),
//                user.getJobRoleCode(),
//                departmentName
//        );
//    }
//}



package com.example.backend.govflow.service;

import com.example.backend.govflow.dto.CreateEmployeeRequestDto;
import com.example.backend.govflow.dto.UserDto;
import com.example.backend.govflow.entity.Department;
import com.example.backend.govflow.entity.Employee;
import com.example.backend.govflow.entity.Role;
import com.example.backend.govflow.entity.Service;
import com.example.backend.govflow.entity.User;
import com.example.backend.govflow.exception.RegistrationException;
import com.example.backend.govflow.exception.ServiceCapacityExceededException;
import com.example.backend.govflow.repository.EmployeeRepository;
import com.example.backend.govflow.repository.RoleRepository;
import com.example.backend.govflow.repository.ServiceRepository;
import com.example.backend.govflow.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@org.springframework.stereotype.Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final ServiceRepository serviceRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;


    @Transactional
    public UserDto createEmployeeUnderManager(CreateEmployeeRequestDto dto) {
        Role employeeRole = roleRepository.findByName("EMPLOYEE")
                .orElseThrow(() -> new IllegalStateException("Role EMPLOYEE not found"));

        if (userRepository.existsByNationalIdAndRoleId(dto.getNationalId(), employeeRole.getId())) {
            throw new RegistrationException("A user with this National ID is already registered as an employee.");
        }
//        if (userRepository.existsByEmail(dto.getEmail())) {
//            throw new RegistrationException("This email is already in use.");
//        }

        Service service = serviceRepository.findById(dto.getServiceId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid Service ID: " + dto.getServiceId()));

        long sequence = employeeRepository.countByServiceId(service.getId()) + 1;
        String formattedSequence = String.format("%03d", sequence);
        String employeeId = String.format("EMP-%s-%s-%s",
                service.getDepartment().getGovCode(),
                service.getCardCode(),
                formattedSequence);

        User newUser = new User();
        newUser.setFullName(dto.getFullName());
        newUser.setNationalId(dto.getNationalId());
//        newUser.setEmail(dto.getEmail());
//        newUser.setPassword(passwordEncoder.encode(dto.getPassword()));
        newUser.setRole(employeeRole);
        newUser.setDepartment(service.getDepartment());
        newUser.setJobRoleCode(employeeId);
        newUser.setEnabled(true);

        User savedUser = userRepository.save(newUser);

        return mapUserToUserDto(savedUser);
    }


    /**
     * ✅ تم تعديل هذه الدالة لتطابق منطق العمل المطلوب
     * الآن، تقوم هذه الدالة بإنشاء سجل في جدول 'employees' فقط، تمامًا كما في الصورة.
     * @param employeeDto بيانات الموظف الجديد.
     * @return الموظف الذي تم إنشاؤه وحفظه في جدول 'employees'.
     */
    public Employee createEmployee(CreateEmployeeRequestDto employeeDto) {
        // 1. التحقق من أن الرقم القومي غير مسجل من قبل في جدول الموظفين
        employeeRepository.findByNationalId(employeeDto.getNationalId()).ifPresent(e -> {
            throw new RegistrationException("Employee with national ID " + employeeDto.getNationalId() + " already exists.");
        });

        // 2. البحث عن الخدمة والتأكد من وجودها
        Service service = serviceRepository.findById(employeeDto.getServiceId())
                .orElseThrow(() -> new EntityNotFoundException("Service with ID " + employeeDto.getServiceId() + " not found."));

        // 3. التحقق من سعة الخدمة (هل هناك مكان لموظف جديد؟)
        long currentEmployeeCount = employeeRepository.countByService(service);
        if (currentEmployeeCount >= service.getMaxEmployees()) {
            throw new ServiceCapacityExceededException("Service '" + service.getName() + "' has reached its maximum capacity of " + service.getMaxEmployees() + " employees.");
        }

        // 4. توليد كود الموظف المميز
        String employeeId = generateEmployeeId(service, currentEmployeeCount);

        // 5. إنشاء كائن الموظف الجديد
        Employee newEmployee = new Employee();
        newEmployee.setNationalId(employeeDto.getNationalId());
        newEmployee.setFullName(employeeDto.getFullName());
        newEmployee.setJobRoleCode(employeeId); // استخدام الكود الذي تم توليده
        newEmployee.setService(service); // ربط الموظف بالخدمة
        newEmployee.setEmployeeId(employeeId); // تعيين الكود المميز
        newEmployee.setRegistered(false); // القيمة الافتراضية تكون false لأنه لم يكمل التسجيل بعد

        // 6. حفظ الموظف في جدول 'employees' وإرجاعه
        return employeeRepository.save(newEmployee);
    }

    private String generateEmployeeId(Service service, long currentCount) {
        // الجزء الأول: ثابت "EMP"
        String prefix = "EMP";

        // الجزء الثاني: كود الجهة الحكومية من الـ Department
        String govCode = service.getDepartment().getGovCode();

        // الجزء الثالث: كود الخدمة/الكارت
        String cardCode = service.getCardCode();

        // الجزء الرابع: الرقم التسلسلي للموظف الجديد
        long serialNumber = currentCount + 1;
        // تنسيق الرقم ليكون دائماً من 3 خانات مع أصفار بادئة (e.g., 5 -> "005")
        String formattedSerialNumber = String.format("%03d", serialNumber);

        return String.format("%s-%s-%s-%s", prefix, govCode, cardCode, formattedSerialNumber);
    }

    private UserDto mapUserToUserDto(User user) {
        String departmentName = Optional.ofNullable(user.getDepartment())
                .map(Department::getName)
                .orElse(null);

        // ✨ --- START: THE REQUIRED MODIFICATION --- ✨
        // تم إضافة `user.getAddress()` هنا
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
                user.getAddress() // ✅ العنوان
        );
        // ✨ --- END: MODIFICATION COMPLETE --- ✨
    }
}