//package com.example.backend.govflow.dto;
//
//import com.fasterxml.jackson.annotation.JsonInclude;
//import lombok.AllArgsConstructor;
//import lombok.Data;
//import lombok.NoArgsConstructor;
//
//@Data
//@NoArgsConstructor
//@AllArgsConstructor
//@JsonInclude(JsonInclude.Include.NON_NULL) // This helps in ignoring null fields in JSON responses
//public class UserDto {
//    private Long id;
//    private String fullName;
//    private String email;
//    private String nationalId;
//    private String phoneNumber;
//    private String role;
//    private String avatar;
//    private String jobRoleCode;    // ✅ تم إضافة هذا الحقل
//    private String departmentName; // ✅ تم إضافة هذا الحقل
//}

package com.example.backend.govflow.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserDto {
    private Long id;
    private String fullName;
    private String email;
    private String nationalId;
    private String phoneNumber;
    private String role;
    private String avatar;
    private String jobRoleCode;
    private String departmentName;

    // ✨ --- START: Added Address Field (Governorate removed) --- ✨
    private String address;
    // ✨ --- END: Added Address Field (Governorate removed) --- ✨


}