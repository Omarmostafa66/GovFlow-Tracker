//package com.example.backend.govflow.dto;
//
//import com.example.backend.govflow.entity.User;
//import lombok.AllArgsConstructor;
//import lombok.Getter;
//import lombok.NoArgsConstructor;
//import lombok.Setter;
//
//@Getter
//@Setter
//@NoArgsConstructor
//@AllArgsConstructor
//public class ProfileDto {
//
//    private Long id;
//    private String fullName;
//    private String email;
//    private String nationalId;
//    private String phoneNumber;
//    private String address;
//    private String department; // سنرسل اسم القسم كنص
//    private String position; // اسم الدور الوظيفي
//    private String avatar; // ✅ 1. تمت إضافة حقل الصورة هنا
//
//    // دالة لتحويل كائن User الكامل إلى ProfileDto
//    public static ProfileDto fromEntity(User user) {
//        return new ProfileDto(
//                user.getId(),
//                user.getFullName(),
//                user.getEmail(),
//                user.getNationalId(),
//                user.getPhoneNumber(),
//                user.getAddress(),
//                user.getDepartment() != null ? user.getDepartment().getName() : null, // تحقق من أن القسم ليس فارغًا
//                user.getRole() != null ? user.getRole().getName() : null,
//                user.getAvatar() // ✅ 2. تمت إضافة قيمة الصورة هنا ليتم إرسالها
//        );
//    }
//}


//package com.example.backend.govflow.dto;
//
//import com.example.backend.govflow.entity.User;
//import lombok.AllArgsConstructor;
//import lombok.Getter;
//import lombok.NoArgsConstructor;
//import lombok.Setter;
//
//@Getter
//@Setter
//@NoArgsConstructor
//@AllArgsConstructor
//public class ProfileDto {
//
//    private Long id;
//    private String fullName;
//    private String email;
//    private String nationalId;
//    private String phoneNumber;
//    private String address;
//    private String department;
//    private String position;
//    private String avatar;
//    private String employeeCode; // ✅ 1. تم إضافة حقل الكود الوظيفي
//
//    // دالة لتحويل كائن User الكامل إلى ProfileDto
//    public static ProfileDto fromEntity(User user) {
//        return new ProfileDto(
//                user.getId(),
//                user.getFullName(),
//                user.getEmail(),
//                user.getNationalId(),
//                user.getPhoneNumber(),
//                user.getAddress(),
//                user.getDepartment() != null ? user.getDepartment().getName() : null,
//                user.getRole() != null ? user.getRole().getName() : null,
//                user.getAvatar(),
//                user.getJobRoleCode() // ✅ 2. تمت إضافة قيمة الكود الوظيفي هنا ليتم إرسالها
//        );
//    }
//}



package com.example.backend.govflow.dto;

import com.example.backend.govflow.entity.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProfileDto {

    private Long id;
    private String fullName;
    private String email;
    private String nationalId;
    private String phoneNumber;
    private String address;
    private String department;
    private String position;
    private String avatar;
    private String employeeCode; // ✅ 1. تم إضافة الحقل هنا
    private Date createdAt;

    // دالة لتحويل كائن User الكامل إلى ProfileDto
    public static ProfileDto fromEntity(User user) {
        return new ProfileDto(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getNationalId(),
                user.getPhoneNumber(),
                user.getAddress(),
                user.getDepartment() != null ? user.getDepartment().getName() : null,
                user.getRole() != null ? user.getRole().getName() : null,
                user.getAvatar(),
                user.getJobRoleCode(), // ✅ 2. تم ربط الحقل بقيمة jobRoleCode
                user.getCreatedAt()
        );
    }
}