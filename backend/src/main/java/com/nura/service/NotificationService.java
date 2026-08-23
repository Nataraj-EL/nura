package com.nura.service;

import com.nura.dto.NotificationPreferenceDto;
import com.nura.model.Notification;
import com.nura.model.NotificationPreference;
import com.nura.model.User;
import com.nura.model.UserProfile;
import com.nura.repository.NotificationPreferenceRepository;
import com.nura.repository.NotificationRepository;
import com.nura.repository.UserProfileRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository notificationPreferenceRepository;
    private final UserProfileRepository userProfileRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               NotificationPreferenceRepository notificationPreferenceRepository,
                               UserProfileRepository userProfileRepository) {
        this.notificationRepository = notificationRepository;
        this.notificationPreferenceRepository = notificationPreferenceRepository;
        this.userProfileRepository = userProfileRepository;
    }

    public ZoneId getUserZoneId(User user) {
        return userProfileRepository.findByUserId(user.getId())
                .map(UserProfile::getTimezone)
                .map(tz -> {
                    try {
                        return ZoneId.of(tz);
                    } catch (Exception e) {
                        return ZoneId.of("UTC");
                    }
                })
                .orElse(ZoneId.of("UTC"));
    }

    /**
     * Get or create notification preferences for a user.
     */
    @Transactional
    public NotificationPreference getOrCreatePreference(User user) {
        return notificationPreferenceRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    NotificationPreference pref = new NotificationPreference(user);
                    return notificationPreferenceRepository.saveAndFlush(pref);
                });
    }

    /**
     * Update notification preferences.
     */
    @Transactional
    public NotificationPreference updatePreference(User user, NotificationPreferenceDto dto) {
        NotificationPreference pref = getOrCreatePreference(user);

        if (dto.getPeriodReminderEnabled() != null) {
            pref.setPeriodReminderEnabled(dto.getPeriodReminderEnabled());
        }
        if (dto.getPeriodStartedEnabled() != null) {
            pref.setPeriodStartedEnabled(dto.getPeriodStartedEnabled());
        }
        if (dto.getWellnessCheckinEnabled() != null) {
            pref.setWellnessCheckinEnabled(dto.getWellnessCheckinEnabled());
        }
        if (dto.getWaterReminderEnabled() != null) {
            pref.setWaterReminderEnabled(dto.getWaterReminderEnabled());
        }
        if (dto.getInsightAvailableEnabled() != null) {
            pref.setInsightAvailableEnabled(dto.getInsightAvailableEnabled());
        }
        if (dto.getScheduledTime() != null) {
            pref.setScheduledTime(LocalTime.parse(dto.getScheduledTime()));
        }
        if (dto.getQuietHoursStart() != null) {
            pref.setQuietHoursStart(LocalTime.parse(dto.getQuietHoursStart()));
        }
        if (dto.getQuietHoursEnd() != null) {
            pref.setQuietHoursEnd(LocalTime.parse(dto.getQuietHoursEnd()));
        }

        return notificationPreferenceRepository.saveAndFlush(pref);
    }

    /**
     * Retrieve delivered or read active notifications that are not expired.
     */
    public List<Notification> getActiveNotifications(User user) {
        return notificationRepository.findActiveNotifications(
                user.getId(),
                Arrays.asList("DELIVERED", "READ"),
                LocalDateTime.now()
        );
    }

    /**
     * Mark a specific notification as READ.
     */
    @Transactional
    public void markAsRead(User user, UUID notificationId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        if (!n.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Unauthorized access to notification.");
        }
        n.setDeliveryStatus("READ");
        n.setReadAt(LocalDateTime.now());
        notificationRepository.save(n);
    }

    /**
     * Create and stage a notification in PENDING state.
     */
    @Transactional
    public Optional<Notification> createNotification(User user, String category, String title, String message, LocalDate recordDate, LocalDateTime expiresAt) {
        NotificationPreference pref = getOrCreatePreference(user);

        // 1. Check preference enablement
        if (!isCategoryEnabled(pref, category)) {
            return Optional.empty();
        }

        // 2. Enforce deduplication in Java (before DB unique constraint saves)
        if (recordDate != null) {
            Optional<Notification> existing = notificationRepository.findByUserIdAndCategoryAndRecordDate(user.getId(), category, recordDate);
            if (existing.isPresent()) {
                return Optional.empty();
            }
        }

        Notification n = new Notification(user, category, title, message);
        n.setRecordDate(recordDate);
        n.setExpiresAt(expiresAt);

        // 3. Quiet Hours check
        ZoneId userZone = getUserZoneId(user);
        LocalDateTime userNow = LocalDateTime.now(userZone);
        
        if (isQuietHours(pref.getQuietHoursStart(), pref.getQuietHoursEnd(), userNow.toLocalTime())) {
            LocalDateTime userNextDelivery = calculateNextEligibleDeliveryTime(userNow, pref.getQuietHoursStart(), pref.getQuietHoursEnd());
            LocalDateTime serverNextDelivery = userNextDelivery.atZone(userZone)
                    .withZoneSameInstant(ZoneId.systemDefault())
                    .toLocalDateTime();
            n.setNextDeliveryTime(serverNextDelivery);
        } else {
            n.setNextDeliveryTime(LocalDateTime.now()); // ready immediately
        }

        try {
            return Optional.of(notificationRepository.saveAndFlush(n));
        } catch (DataIntegrityViolationException ex) {
            // Safe concurrent duplicate skip
            return Optional.empty();
        }
    }

    private boolean isCategoryEnabled(NotificationPreference pref, String category) {
        switch (category.toUpperCase()) {
            case "PERIOD_REMINDER":
                return pref.isPeriodReminderEnabled();
            case "PERIOD_STARTED":
                return pref.isPeriodStartedEnabled();
            case "WELLNESS_CHECKIN":
                return pref.isWellnessCheckinEnabled();
            case "WATER_REMINDER":
                return pref.isWaterReminderEnabled();
            case "INSIGHT_AVAILABLE":
                return pref.isInsightAvailableEnabled();
            default:
                return true;
        }
    }

    public boolean isQuietHours(LocalTime start, LocalTime end, LocalTime target) {
        if (start == null || end == null) return false;
        if (start.equals(end)) return target.equals(start);
        if (start.isBefore(end)) {
            return !target.isBefore(start) && target.isBefore(end);
        } else {
            // Crosses midnight, e.g. 22:00 to 07:00
            return !target.isBefore(start) || target.isBefore(end);
        }
    }

    public LocalDateTime calculateNextEligibleDeliveryTime(LocalDateTime userDateTime, LocalTime start, LocalTime end) {
        LocalDate date = userDateTime.toLocalDate();
        LocalTime time = userDateTime.toLocalTime();
        if (!isQuietHours(start, end, time)) {
            return userDateTime;
        }
        if (start.isBefore(end)) {
            // e.g. 09:00 to 17:00
            return date.atTime(end);
        } else {
            // e.g. 22:00 to 07:00
            if (!time.isBefore(start)) {
                return date.plusDays(1).atTime(end);
            } else {
                return date.atTime(end);
            }
        }
    }
}
