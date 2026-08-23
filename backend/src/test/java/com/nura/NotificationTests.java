package com.nura;

import com.nura.dto.NotificationPreferenceDto;
import com.nura.model.Notification;
import com.nura.model.NotificationPreference;
import com.nura.model.User;
import com.nura.model.UserProfile;
import com.nura.repository.NotificationPreferenceRepository;
import com.nura.repository.NotificationRepository;
import com.nura.repository.UserProfileRepository;
import com.nura.repository.UserRepository;
import com.nura.service.NotificationDeliveryService;
import com.nura.service.NotificationService;
import com.nura.scheduler.NotificationScheduler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class NotificationTests {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NotificationDeliveryService notificationDeliveryService;

    @Autowired
    private NotificationScheduler notificationScheduler;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private NotificationPreferenceRepository notificationPreferenceRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    private User primaryUser;
    private User secondaryUser;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        notificationPreferenceRepository.deleteAll();
        userProfileRepository.deleteAll();
        userRepository.deleteAll();

        primaryUser = userRepository.save(new User("+919000000008", "ACTIVE"));
        userProfileRepository.save(new UserProfile(primaryUser, "COMPLETED"));

        secondaryUser = userRepository.save(new User("+919000000009", "ACTIVE"));
        userProfileRepository.save(new UserProfile(secondaryUser, "COMPLETED"));
    }

    @Test
    void testNotificationPreferenceCreationAndDefaults() {
        NotificationPreference pref = notificationService.getOrCreatePreference(primaryUser);
        assertNotNull(pref.getId());
        assertTrue(pref.isPeriodReminderEnabled());
        assertTrue(pref.isWellnessCheckinEnabled());
        assertEquals(LocalTime.of(20, 0), pref.getScheduledTime());
    }

    @Test
    void testNotificationLifecycleTransitions() {
        // 1. Staged -> PENDING
        Optional<Notification> created = notificationService.createNotification(
                primaryUser,
                "WELLNESS_CHECKIN",
                "Check-in",
                "Log your metrics today.",
                LocalDate.now(),
                LocalDateTime.now().plusDays(1)
        );
        assertTrue(created.isPresent());
        Notification n = created.get();
        assertEquals("PENDING", n.getDeliveryStatus());

        // 2. Deliver -> DELIVERED
        notificationDeliveryService.deliverPendingNotifications();
        n = notificationRepository.findById(n.getId()).orElseThrow();
        assertEquals("DELIVERED", n.getDeliveryStatus());

        // 3. Mark Read -> READ
        notificationService.markAsRead(primaryUser, n.getId());
        n = notificationRepository.findById(n.getId()).orElseThrow();
        assertEquals("READ", n.getDeliveryStatus());
        assertNotNull(n.getReadAt());
    }

    @Test
    void testQuietHoursMidnightCrossing() {
        NotificationPreference pref = notificationService.getOrCreatePreference(primaryUser);
        pref.setQuietHoursStart(LocalTime.of(22, 0));
        pref.setQuietHoursEnd(LocalTime.of(7, 0));
        notificationPreferenceRepository.save(pref);

        ZoneId userZone = notificationService.getUserZoneId(primaryUser);
        LocalDate date = LocalDate.now(userZone);

        // Target time: 23:00 (inside quiet hours 22:00-07:00)
        LocalDateTime userDateTime = date.atTime(23, 0);
        assertTrue(notificationService.isQuietHours(pref.getQuietHoursStart(), pref.getQuietHoursEnd(), userDateTime.toLocalTime()));

        // Calculate next delivery time
        LocalDateTime nextDelivery = notificationService.calculateNextEligibleDeliveryTime(
                userDateTime, 
                pref.getQuietHoursStart(), 
                pref.getQuietHoursEnd()
        );
        // Should be tomorrow at 07:00
        assertEquals(date.plusDays(1).atTime(7, 0), nextDelivery);

        // Target time: 04:00 (inside quiet hours 22:00-07:00)
        LocalDateTime earlyMorning = date.atTime(4, 0);
        assertTrue(notificationService.isQuietHours(pref.getQuietHoursStart(), pref.getQuietHoursEnd(), earlyMorning.toLocalTime()));

        LocalDateTime nextDeliveryEarly = notificationService.calculateNextEligibleDeliveryTime(
                earlyMorning, 
                pref.getQuietHoursStart(), 
                pref.getQuietHoursEnd()
        );
        // Should be today at 07:00
        assertEquals(date.atTime(7, 0), nextDeliveryEarly);
    }

    @Test
    void testDatabaseLevelDeduplicationIndex() {
        LocalDate recordDate = LocalDate.of(2026, 8, 23);

        Notification n1 = new Notification(primaryUser, "WELLNESS_CHECKIN", "Nudge 1", "Log metrics.");
        n1.setRecordDate(recordDate);
        notificationRepository.save(n1);

        Notification n2 = new Notification(primaryUser, "WELLNESS_CHECKIN", "Nudge 2", "Duplicate logs.");
        n2.setRecordDate(recordDate);

        // Attempting to save n2 directly should trigger a UniqueConstraintViolation / DataIntegrityViolation
        assertThrows(DataIntegrityViolationException.class, () -> {
            notificationRepository.saveAndFlush(n2);
        });
    }

    @Test
    void testExpiryHandlingFiltersItems() {
        LocalDate today = LocalDate.now();
        Optional<Notification> n1 = notificationService.createNotification(
                primaryUser,
                "WELLNESS_CHECKIN",
                "Alert 1",
                "Log water.",
                today,
                LocalDateTime.now().minusHours(1) // expired 1 hour ago
        );
        Optional<Notification> n2 = notificationService.createNotification(
                primaryUser,
                "WELLNESS_CHECKIN",
                "Alert 2",
                "Log sleep.",
                today.plusDays(1), // distinct date to bypass dedup check
                LocalDateTime.now().plusHours(2) // active
        );
        assertTrue(n1.isPresent());
        assertTrue(n2.isPresent());

        // Deliver them
        notificationDeliveryService.deliverPendingNotifications();

        List<Notification> active = notificationService.getActiveNotifications(primaryUser);
        // Only n2 is returned; expired n1 is filtered out
        assertEquals(1, active.size());
        assertEquals(n2.get().getId(), active.get(0).getId());
    }

    @Test
    void testDisabledCategorySkipsCreation() {
        NotificationPreference pref = notificationService.getOrCreatePreference(primaryUser);
        pref.setWaterReminderEnabled(false); // disable water nudge
        notificationPreferenceRepository.save(pref);

        Optional<Notification> n = notificationService.createNotification(
                primaryUser,
                "WATER_REMINDER",
                "Hydrate",
                "Track water.",
                LocalDate.now(),
                null
        );
        // Creation skipped
        assertFalse(n.isPresent());
    }

    @Test
    void testOwnershipSecurityBoundaries() {
        Optional<Notification> n = notificationService.createNotification(
                primaryUser,
                "WELLNESS_CHECKIN",
                "Check",
                "Log.",
                LocalDate.now(),
                null
        );
        assertTrue(n.isPresent());
        notificationDeliveryService.deliverPendingNotifications();

        // Secondary user cannot read primary user's alert
        List<Notification> secActive = notificationService.getActiveNotifications(secondaryUser);
        assertEquals(0, secActive.size());

        // Secondary user marking primary user's notification read should throw SecurityException
        assertThrows(SecurityException.class, () -> {
            notificationService.markAsRead(secondaryUser, n.get().getId());
        });
    }
}
