package com.nura.service;

import com.nura.model.*;
import com.nura.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PeriodRecordRepository periodRecordRepository;
    private final WellnessRecordRepository wellnessRecordRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository notificationPreferenceRepository;
    private final UserSessionRepository userSessionRepository;
    private final UserOtpRepository userOtpRepository;

    public UserService(UserRepository userRepository,
                       UserProfileRepository userProfileRepository,
                       PeriodRecordRepository periodRecordRepository,
                       WellnessRecordRepository wellnessRecordRepository,
                       NotificationRepository notificationRepository,
                       NotificationPreferenceRepository notificationPreferenceRepository,
                       UserSessionRepository userSessionRepository,
                       UserOtpRepository userOtpRepository) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.periodRecordRepository = periodRecordRepository;
        this.wellnessRecordRepository = wellnessRecordRepository;
        this.notificationRepository = notificationRepository;
        this.notificationPreferenceRepository = notificationPreferenceRepository;
        this.userSessionRepository = userSessionRepository;
        this.userOtpRepository = userOtpRepository;
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

    /**
     * Export user data ensuring sensitive parameters like session tokens or hashed OTPs are excluded.
     */
    public Map<String, Object> exportData(User user) {
        logger.info("Audit log: Data export requested for user: {}", user.getId());
        UUID userId = user.getId();

        Map<String, Object> export = new LinkedHashMap<>();
        export.put("phoneNumber", user.getPhoneNumber());
        export.put("status", user.getStatus());

        // Profile Mapping
        userProfileRepository.findByUserId(userId).ifPresent(profile -> {
            Map<String, Object> pm = new LinkedHashMap<>();
            pm.put("age", profile.getAge());
            pm.put("typicalCycleLength", profile.getTypicalCycleLength());
            pm.put("typicalPeriodDuration", profile.getTypicalPeriodDuration());
            pm.put("timezone", profile.getTimezone());
            pm.put("waterGoal", profile.getWaterGoal());
            export.put("profile", pm);
        });

        // Period Records mapping
        List<PeriodRecord> periods = periodRecordRepository.findByUserIdOrderByStartDateAsc(userId);
        List<Map<String, Object>> periodList = new ArrayList<>();
        for (PeriodRecord pr : periods) {
            Map<String, Object> pm = new LinkedHashMap<>();
            pm.put("startDate", pr.getStartDate());
            pm.put("endDate", pr.getEndDate());
            periodList.add(pm);
        }
        export.put("periods", periodList);

        // Wellness Records mapping
        List<WellnessRecord> wellnessRecords = wellnessRecordRepository.findByUserIdOrderByRecordDateAsc(userId);
        List<Map<String, Object>> wellnessList = new ArrayList<>();
        for (WellnessRecord wr : wellnessRecords) {
            Map<String, Object> wm = new LinkedHashMap<>();
            wm.put("recordDate", wr.getRecordDate());
            wm.put("waterIntake", wr.getWaterIntake());
            wm.put("sleepDurationMinutes", wr.getSleepDurationMinutes());
            wm.put("mood", wr.getMood());
            wm.put("energyLevel", wr.getEnergyLevel());
            wm.put("symptoms", wr.getSymptoms());
            wm.put("note", wr.getNote());
            wellnessList.add(wm);
        }
        export.put("wellness", wellnessList);

        // Notification Preferences mapping
        notificationPreferenceRepository.findByUserId(userId).ifPresent(pref -> {
            Map<String, Object> pm = new LinkedHashMap<>();
            pm.put("periodReminderEnabled", pref.isPeriodReminderEnabled());
            pm.put("periodStartedEnabled", pref.isPeriodStartedEnabled());
            pm.put("wellnessCheckinEnabled", pref.isWellnessCheckinEnabled());
            pm.put("waterReminderEnabled", pref.isWaterReminderEnabled());
            pm.put("insightAvailableEnabled", pref.isInsightAvailableEnabled());
            pm.put("scheduledTime", pref.getScheduledTime());
            pm.put("quietHoursStart", pref.getQuietHoursStart());
            pm.put("quietHoursEnd", pref.getQuietHoursEnd());
            export.put("notificationPreferences", pm);
        });

        // Notifications history mapping
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<Map<String, Object>> notificationList = new ArrayList<>();
        for (Notification n : notifications) {
            Map<String, Object> nm = new LinkedHashMap<>();
            nm.put("category", n.getCategory());
            nm.put("title", n.getTitle());
            nm.put("message", n.getMessage());
            nm.put("nextDeliveryTime", n.getNextDeliveryTime());
            nm.put("deliveryStatus", n.getDeliveryStatus());
            nm.put("deliveryChannel", n.getDeliveryChannel());
            nm.put("readAt", n.getReadAt());
            notificationList.add(nm);
        }
        export.put("notifications", notificationList);

        return export;
    }

    /**
     * Securely delete user account cascading data cleanup across all repositories.
     */
    @Transactional
    public void deleteAccount(User user) {
        logger.info("Audit log: Account deletion initiated for user: {}", user.getId());
        UUID userId = user.getId();

        notificationPreferenceRepository.deleteByUserId(userId);
        notificationRepository.deleteByUserId(userId);
        wellnessRecordRepository.deleteByUserId(userId);
        periodRecordRepository.deleteByUserId(userId);
        userSessionRepository.deleteByUserId(userId);
        userOtpRepository.deleteByPhoneNumber(user.getPhoneNumber());
        userProfileRepository.deleteByUserId(userId);
        userRepository.delete(user);

        logger.info("Audit log: Account deletion completed successfully for user ID: {}", userId);
    }
}
