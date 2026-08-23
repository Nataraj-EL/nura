package com.nura.service;

import com.nura.model.User;
import com.nura.model.UserProfile;
import com.nura.repository.UserProfileRepository;
import com.nura.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    public UserService(UserRepository userRepository, UserProfileRepository userProfileRepository) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
    }

    /**
     * Get user profile by User ID.
     */
    public Optional<UserProfile> getProfileByUserId(UUID userId) {
        return userProfileRepository.findByUserId(userId);
    }

    /**
     * Complete onboarding for a user, filling in profile attributes and transitioning user to ACTIVE.
     */
    @Transactional
    public UserProfile completeOnboarding(User user, int age, int typicalCycleLength, int typicalPeriodDuration, String timezone) {
        return updateProfile(user, age, typicalCycleLength, typicalPeriodDuration, timezone, "COMPLETED", 2000);
    }

    /**
     * Update user profile supporting partial updates and onboarding status transitions.
     */
    @Transactional
    public UserProfile updateProfile(User user, Integer age, Integer typicalCycleLength, Integer typicalPeriodDuration, String timezone, String onboardingStatus, Integer waterGoal) {
        UserProfile profile = userProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> new UserProfile(user, "PENDING"));

        if (age != null) {
            if (age < 0 || age > 120) {
                throw new IllegalArgumentException("Please provide a valid age.");
            }
            profile.setAge(age);
        }
        if (typicalCycleLength != null) {
            if (typicalCycleLength < 10 || typicalCycleLength > 100) {
                throw new IllegalArgumentException("Typical cycle length must be between 10 and 100 days.");
            }
            profile.setTypicalCycleLength(typicalCycleLength);
        }
        if (typicalPeriodDuration != null) {
            if (typicalPeriodDuration < 1 || typicalPeriodDuration > 20) {
                throw new IllegalArgumentException("Typical period duration must be valid.");
            }
            profile.setTypicalPeriodDuration(typicalPeriodDuration);
        }
        if (timezone != null) {
            profile.setTimezone(timezone);
        }
        if (onboardingStatus != null) {
            profile.setOnboardingStatus(onboardingStatus.toUpperCase());
            if ("COMPLETED".equalsIgnoreCase(onboardingStatus)) {
                user.setStatus("ACTIVE");
                userRepository.save(user);
            }
        }
        if (waterGoal != null) {
            if (waterGoal < 0 || waterGoal > 20000) {
                throw new IllegalArgumentException("Water goal must be positive and below 20,000 ml.");
            }
            profile.setWaterGoal(waterGoal);
        }

        return userProfileRepository.save(profile);
    }
}
