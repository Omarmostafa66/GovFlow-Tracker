package com.example.backend.govflow.controller;

import com.example.backend.govflow.dto.ChangePasswordDto;
import com.example.backend.govflow.dto.ProfileDto;
import com.example.backend.govflow.dto.UpdateProfileDto;
import com.example.backend.govflow.entity.User;
import com.example.backend.govflow.repository.UserRepository;
import com.example.backend.govflow.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserService userService;
    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;

    /**
     * Fetches the complete and updated profile data for the current user.
     * @param currentUser The user authenticated by Spring Security.
     * @return ResponseEntity containing a ProfileDto with the user's full and updated data.
     */
    @GetMapping
    public ResponseEntity<ProfileDto> getMyProfile(@AuthenticationPrincipal User currentUser) {
        User freshUser = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        ProfileDto profileDto = ProfileDto.fromEntity(freshUser);
        return ResponseEntity.ok(profileDto);
    }

    /**
     * Updates the profile data for the current user.
     * @param currentUser The current user.
     * @param profileDataJson The new data as a JSON string.
     * @param avatarFile The image file (optional).
     * @return ResponseEntity containing the updated ProfileDto.
     */
    @PutMapping
    public ResponseEntity<ProfileDto> updateMyProfile(
            @AuthenticationPrincipal User currentUser,
            @RequestPart("profile") String profileDataJson,
            @RequestPart(value = "avatar", required = false) MultipartFile avatarFile) throws Exception {

        UpdateProfileDto updateProfileDto = objectMapper.readValue(profileDataJson, UpdateProfileDto.class);

        ProfileDto updatedUser = userService.updateProfile(currentUser.getId(), updateProfileDto, avatarFile);
        return ResponseEntity.ok(updatedUser);
    }

    /**
     * Changes the password for the current user.
     * @param currentUser The current user.
     * @param changePasswordDto Contains the current and new passwords.
     * @return ResponseEntity with a success message.
     */
    @PostMapping("/change-password")
    public ResponseEntity<?> changeMyPassword(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody ChangePasswordDto changePasswordDto) {

        userService.changePassword(currentUser.getId(), changePasswordDto);
        // The response was modified to return a clear message for the frontend
        return ResponseEntity.ok(Map.of("message", "Password updated successfully!"));
    }

    // START: NEW CODE FOR AVATAR DELETION
    /**
     * Deletes the profile picture for the current user.
     * @param currentUser The current user.
     * @return An empty ResponseEntity indicating success.
     */
    @DeleteMapping("/avatar")
    public ResponseEntity<Void> deleteMyAvatar(@AuthenticationPrincipal User currentUser) {
        userService.deleteAvatar(currentUser.getId());
        return ResponseEntity.noContent().build(); // Returning 204 No Content is most appropriate for deletion
    }
    // END: NEW CODE FOR AVATAR DELETION
}