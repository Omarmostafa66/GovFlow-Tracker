package com.example.backend.govflow.controller;

import com.example.backend.govflow.dto.*;
import com.example.backend.govflow.entity.User;
import com.example.backend.govflow.exception.RegistrationException;
import com.example.backend.govflow.security.jwt.JwtService;
import com.example.backend.govflow.service.NotificationService; // ✅ Required import
import com.example.backend.govflow.service.UserService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtService jwtService;
    private final ObjectMapper objectMapper;
    private final NotificationService notificationService; // ✅ Required injection

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        UserDetails userDetails = userService.loadUserByIdentifierAndRole(request.getNationalId(), request.getRole());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(userDetails.getUsername(), request.getPassword())
        );

        User user = (User) authentication.getPrincipal();
        String token = jwtService.generateToken(user);


        //  THE REQUIRED MODIFICATION (Add Notification Logic)
        String title = "Security Alert: New Login";
        String message = "A new session was started for your account. If this was not you, please secure your account immediately.";
        notificationService.createNotificationForUser(user, title, message);

        UserDto userDto = new UserDto(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getNationalId(),
                user.getPhoneNumber(),
                user.getRole().getName(),
                user.getAvatar(),
                user.getJobRoleCode(),
                user.getDepartment() != null ? user.getDepartment().getName() : null,
                user.getAddress() //
        );

        return ResponseEntity.ok(new AuthResponse(token, userDto));
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequest request) {
        userService.register(request);
        Map<String, String> response = Map.of("message", "A verification link has been sent to your email.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/update-pending-registration")
    public ResponseEntity<Map<String, String>> updatePendingRegistration(@Valid @RequestBody RegisterRequest request) {
        userService.updatePendingRegistration(request);
        return ResponseEntity.ok(Map.of("message", "Account updated. A new verification link has been sent."));
    }

    @GetMapping("/verify")
    public ResponseEntity<Void> verifyAccount(@RequestParam("token") String token) {
        try {
            User registeredUser = userService.completeRegistration(token);
            String jwtToken = jwtService.generateToken(registeredUser);


            UserDto userDto = new UserDto(
                    registeredUser.getId(),
                    registeredUser.getFullName(),
                    registeredUser.getEmail(),
                    registeredUser.getNationalId(),
                    registeredUser.getPhoneNumber(),
                    registeredUser.getRole().getName(),
                    registeredUser.getAvatar(),
                    registeredUser.getJobRoleCode(),
                    registeredUser.getDepartment() != null ? registeredUser.getDepartment().getName() : null,
                    registeredUser.getAddress() //
            );


            String userJson = objectMapper.writeValueAsString(userDto);
            String encodedUser = Base64.getUrlEncoder().encodeToString(userJson.getBytes(StandardCharsets.UTF_8));

            String redirectUrl = "http://localhost:4200/login?token=" + jwtToken + "&user=" + encodedUser;

            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(redirectUrl))
                    .build();

        } catch (RuntimeException | JsonProcessingException e) {
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create("http://localhost:4200/verification-failure"))
                    .build();
        }
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Map<String, String>> resendVerification(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required."));
        }
        try {
            userService.resendVerificationLink(email);
            return ResponseEntity.ok(Map.of("message", "A new verification link has been sent."));
        } catch (RegistrationException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> requestPasswordReset(@Valid @RequestBody PasswordResetRequestDto requestDto) {
        userService.initiatePasswordReset(requestDto.getIdentifier());
        return ResponseEntity.ok(Map.of("message", "If an account with that identifier exists, a password reset link has been sent to the registered email address."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> completePasswordReset(@Valid @RequestBody PasswordResetCompletionDto completionDto) {
        try {
            userService.completePasswordReset(completionDto.getToken(), completionDto.getNewPassword());
            return ResponseEntity.ok("Password has been reset successfully.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}