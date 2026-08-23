package com.nura.controller;

import com.nura.model.User;
import com.nura.model.UserProfile;
import com.nura.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    public static class OnboardingRequest {
        @Min(value = 10, message = "Age must be at least 10")
        @Max(value = 120, message = "Age must be at most 120")
        private Integer age;

        @Min(value = 10, message = "Cycle length must be at least 10 days")
        @Max(value = 100, message = "Cycle length must be at most 100 days")
        private Integer typicalCycleLength;

        @Min(value = 1, message = "Period duration must be at least 1 day")
        @Max(value = 20, message = "Period duration must be at most 20 days")
        private Integer typicalPeriodDuration;

        private String timezone;
        private String onboardingStatus;
        private Integer waterGoal;

        // Getters and Setters
        public Integer getAge() {
            return age;
        }

        public void setAge(Integer age) {
            this.age = age;
        }

        public Integer getTypicalCycleLength() {
            return typicalCycleLength;
        }

        public void setTypicalCycleLength(Integer typicalCycleLength) {
            this.typicalCycleLength = typicalCycleLength;
        }

        public Integer getTypicalPeriodDuration() {
            return typicalPeriodDuration;
        }

        public void setTypicalPeriodDuration(Integer typicalPeriodDuration) {
            this.typicalPeriodDuration = typicalPeriodDuration;
        }

        public String getTimezone() {
            return timezone;
        }

        public void setTimezone(String timezone) {
            this.timezone = timezone;
        }

        public String getOnboardingStatus() {
            return onboardingStatus;
        }

        public void setOnboardingStatus(String onboardingStatus) {
            this.onboardingStatus = onboardingStatus;
        }

        public Integer getWaterGoal() {
            return waterGoal;
        }

        public void setWaterGoal(Integer waterGoal) {
            this.waterGoal = waterGoal;
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getProfile() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UserProfile profile = userService.getProfileByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Profile does not exist."));

        Map<String, Object> response = new HashMap<>();
        response.put("age", profile.getAge());
        response.put("typicalCycleLength", profile.getTypicalCycleLength());
        response.put("typicalPeriodDuration", profile.getTypicalPeriodDuration());
        response.put("timezone", profile.getTimezone());
        response.put("onboardingStatus", profile.getOnboardingStatus());
        response.put("waterGoal", profile.getWaterGoal());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(@Valid @RequestBody OnboardingRequest request) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        
        UserProfile profile = userService.updateProfile(
                user,
                request.getAge(),
                request.getTypicalCycleLength(),
                request.getTypicalPeriodDuration(),
                request.getTimezone(),
                request.getOnboardingStatus(),
                request.getWaterGoal()
        );

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Profile updated successfully.");
        response.put("age", profile.getAge());
        response.put("typicalCycleLength", profile.getTypicalCycleLength());
        response.put("typicalPeriodDuration", profile.getTypicalPeriodDuration());
        response.put("timezone", profile.getTimezone());
        response.put("onboardingStatus", profile.getOnboardingStatus());
        response.put("waterGoal", profile.getWaterGoal());
        return ResponseEntity.ok(response);
    }
}
