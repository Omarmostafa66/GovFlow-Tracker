package com.example.backend.govflow.repository;

import com.example.backend.govflow.dto.UserDto;
import com.example.backend.govflow.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByNationalIdAndRoleId(String nationalId, Long roleId);

    // ✅ START: THE REQUIRED MODIFICATION
    // This method is needed to find a user's specific account (e.g., EMPLOYEE)
    Optional<User> findByNationalIdAndRole_Name(String nationalId, String roleName);
    // ✅ END: MODIFICATION COMPLETE

    Optional<User> findByEmailAndRoleId(String email, Long roleId);

    Optional<User> findByVerificationToken(String token);

    Optional<User> findByResetPasswordToken(String token);

    Optional<User> findFirstByNationalId(String nationalId);

    boolean existsByEmail(String email);

    boolean existsByNationalId(String nationalId);

    List<User> findAllByRoleNameNot(String roleName);

    boolean existsByNationalIdAndRoleId(String nationalId, Long roleId);

    // ✨ --- START: MODIFICATION 1 (Comment Translated) --- ✨
    // This query was modified to match the new UserDto structure
    @Query("SELECT new com.example.backend.govflow.dto.UserDto(u.id, u.fullName, u.email, u.nationalId, u.phoneNumber, r.name, u.avatar, u.jobRoleCode, d.name, u.address) " +
            "FROM User u JOIN u.role r LEFT JOIN u.department d WHERE u.department.id = :departmentId")
    List<UserDto> findAllByDepartmentId(@Param("departmentId") Long departmentId);
    // ✨ --- END: MODIFICATION COMPLETE --- ✨

    // ✨ --- START: MODIFICATION 2 (Comment Translated) --- ✨
    // This query was also modified to match the new UserDto structure
    @Query("SELECT new com.example.backend.govflow.dto.UserDto(u.id, u.fullName, u.email, u.nationalId, u.phoneNumber, r.name, u.avatar, u.jobRoleCode, d.name, u.address) " +
            "FROM User u JOIN u.role r LEFT JOIN u.department d WHERE u.nationalId IN :nationalIds")
    List<UserDto> findAllByNationalIdIn(@Param("nationalIds") List<String> nationalIds);
    // ✨ --- END: MODIFICATION COMPLETE --- ✨

    @Query("SELECT u FROM User u JOIN u.role r WHERE u.department.id = :departmentId AND r.name = :roleName")
    List<User> findUsersByDepartmentIdAndRoleName(@Param("departmentId") Long departmentId, @Param("roleName") String roleName);

    @Query("SELECT u FROM User u JOIN u.role r WHERE u.nationalId IN :nationalIds AND r.name = :roleName")
    List<User> findAllUsersByNationalIdInAndRoleName(@Param("nationalIds") List<String> nationalIds, @Param("roleName") String roleName);
}