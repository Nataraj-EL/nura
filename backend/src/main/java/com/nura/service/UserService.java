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
        if (age < 0 || age > 120) {
            throw new IllegalArgumentException("Please provide a valid age.");
        }
        if (typicalCycleLength < 10 || typicalCycleLength > 100) {
            throw new IllegalArgumentException("Typical cycle length must be between 10 and 100 days.");
        }
        if (typicalPeriodDuration < 1 || typicalPeriodDuration > 20 || typicalPeriodDuration >= typicalCycleLength) {
            throw new IllegalArgumentException("Typical period duration must be valid and shorter than your cycle length.");
        }

        UserProfile profile = userProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> new UserProfile(user, "PENDING"));

        profile.setAge(age);
        profile.setTypicalCycleLength(typicalCycleLength);
        profile.setTypicalPeriodDuration(typicalPeriodDuration);
        profile.setTimezone(timezone != null ? timezone : "UTC");
        profile.setOnboardingStatus("COMPLETED");
        UserProfile savedProfile = userProfileRepository.save(profile);

        // Update User status to ACTIVE
        user.setStatus("ACTIVE");
        userRepository.save(user);

        return savedProfile;
    }
}
