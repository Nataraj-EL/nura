package com.nura.controller;

import com.nura.model.User;
import com.nura.model.UserProfile;
import com.nura.model.UserSession;
import com.nura.service.AuthService;
import com.nura.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    @org.springframework.beans.factory.annotation.Value("${nura.cookie.secure:false}")
    private boolean cookieSecure;

    public AuthController(AuthService authService, UserService userService) {
        this.authService = authService;
        this.userService = userService;
    }

    public static class LoginRequest {
        private String phoneNumber;
        private String email;

        public String getPhoneNumber() {
            return phoneNumber;
        }

        public void setPhoneNumber(String phoneNumber) {
            this.phoneNumber = phoneNumber;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }
    }

    public static class VerifyRequest {
        private String phoneNumber;
        private String email;

        @NotBlank(message = "Verification code is required")
        private String code;

        public String getPhoneNumber() {
            return phoneNumber;
        }

        public void setPhoneNumber(String phoneNumber) {
            this.phoneNumber = phoneNumber;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@Valid @RequestBody LoginRequest request) {
        String email = request.getEmail();
        String phoneNumber = request.getPhoneNumber();

        if ((email == null || email.trim().isEmpty()) && (phoneNumber == null || phoneNumber.trim().isEmpty())) {
            Map<String, String> response = new HashMap<>();
            response.put("error", "Email or phone number is required.");
            return ResponseEntity.badRequest().body(response);
        }

        if (email != null && !email.trim().isEmpty()) {
            authService.requestOtpForEmail(email.trim().toLowerCase());
        } else {
            String normalizedPhone = authService.normalizePhoneNumber(phoneNumber);
            authService.requestOtp(normalizedPhone);
        }
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Verification code sent successfully.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verify(@Valid @RequestBody VerifyRequest request, 
                                                      HttpServletRequest httpRequest, 
                                                      HttpServletResponse httpResponse) {
        String email = request.getEmail();
        String phoneNumber = request.getPhoneNumber();

        if ((email == null || email.trim().isEmpty()) && (phoneNumber == null || phoneNumber.trim().isEmpty())) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", "Email or phone number is required.");
            return ResponseEntity.badRequest().body(response);
        }

        UserSession session;
        if (email != null && !email.trim().isEmpty()) {
            session = authService.verifyOtpForEmail(email.trim().toLowerCase(), request.getCode());
        } else {
            String normalizedPhone = authService.normalizePhoneNumber(phoneNumber);
            session = authService.verifyOtp(normalizedPhone, request.getCode());
        }

        User user = session.getUser();
        
        UserProfile profile = userService.getProfileByUserId(user.getId())
                .orElseThrow(() -> new IllegalStateException("User profile missing."));

        // Format Secure Cookie Header with SameSite=Lax support
        String cookieHeader = String.format("nura_session=%s; Path=/; Max-Age=%d; HttpOnly; SameSite=Lax%s", 
                session.getToken(), 7 * 24 * 60 * 60, (cookieSecure || httpRequest.isSecure()) ? "; Secure" : "");
        httpResponse.addHeader("Set-Cookie", cookieHeader);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Verification successful.");
        response.put("status", user.getStatus());
        response.put("onboardingStatus", profile.getOnboardingStatus());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        String token = null;
        if (httpRequest.getCookies() != null) {
            for (Cookie cookie : httpRequest.getCookies()) {
                if ("nura_session".equals(cookie.getName())) {
                    token = cookie.getValue();
                    break;
                }
            }
        }

        if (token != null) {
            authService.revokeSession(token);
        }

        // Overwrite and delete cookie on client
        String cookieHeader = String.format("nura_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax%s", 
                (cookieSecure || httpRequest.isSecure()) ? "; Secure" : "");
        httpResponse.addHeader("Set-Cookie", cookieHeader);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Successfully logged out.");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        
        if (principal instanceof User) {
            User user = (User) principal;
            UserProfile profile = userService.getProfileByUserId(user.getId())
                    .orElseThrow(() -> new IllegalStateException("Profile mapping is missing for active user."));
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("phoneNumber", user.getPhoneNumber());
            response.put("email", user.getEmail());
            response.put("status", user.getStatus());
            response.put("onboardingStatus", profile.getOnboardingStatus());
            return ResponseEntity.ok(response);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("authenticated", false);
        return ResponseEntity.status(HttpServletResponse.SC_UNAUTHORIZED).body(response);
    }
}
