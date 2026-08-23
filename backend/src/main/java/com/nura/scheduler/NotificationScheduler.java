package com.nura.scheduler;

import com.nura.model.User;
import com.nura.model.UserProfile;
import com.nura.model.WellnessRecord;
import com.nura.repository.UserProfileRepository;
import com.nura.repository.UserRepository;
import com.nura.repository.WellnessRecordRepository;
import com.nura.service.CycleService;
import com.nura.service.NotificationDeliveryService;
import com.nura.service.NotificationService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

@Component
public class NotificationScheduler {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final WellnessRecordRepository wellnessRecordRepository;
    private final NotificationService notificationService;
    private final NotificationDeliveryService notificationDeliveryService;
    private final CycleService cycleService;

    public NotificationScheduler(UserRepository userRepository,
                                 UserProfileRepository userProfileRepository,
                                 WellnessRecordRepository wellnessRecordRepository,
                                 NotificationService notificationService,
                                 NotificationDeliveryService notificationDeliveryService,
                                 CycleService cycleService) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.wellnessRecordRepository = wellnessRecordRepository;
        this.notificationService = notificationService;
        this.notificationDeliveryService = notificationDeliveryService;
        this.cycleService = cycleService;
    }

    /**
     * Periodically evaluate and generate reminders for all active users.
     * Scheduled to run every 15 minutes.
     */
    @Scheduled(cron = "0 */15 * * * *")
    public void runSchedulerJobs() {
        List<User> users = userRepository.findAll();
        for (User user : users) {
            try {
                processUserReminders(user);
            } catch (Exception e) {
                // Keep processing other users if one fails
            }
        }

        // Deliver all eligible PENDING notifications
        notificationDeliveryService.deliverPendingNotifications();
    }

    public void processUserReminders(User user) {
        ZoneId userZone = notificationService.getUserZoneId(user);
        LocalDate userToday = LocalDate.now(userZone);
        LocalTime userLocalTime = LocalTime.now(userZone);

        UserProfile profile = userProfileRepository.findByUserId(user.getId()).orElse(null);
        if (profile == null) return;

        // 1. Wellness Log Check-in Reminder
        LocalTime schedTime = notificationService.getOrCreatePreference(user).getScheduledTime();
        if (!userLocalTime.isBefore(schedTime)) {
            boolean loggedToday = wellnessRecordRepository.findByUserIdAndRecordDate(user.getId(), userToday)
                    .map(r -> r.getWaterIntake() != null || r.getMood() != null || r.getEnergyLevel() != null || r.getSleepDurationMinutes() != null)
                    .orElse(false);

            if (!loggedToday) {
                notificationService.createNotification(
                        user,
                        "WELLNESS_CHECKIN",
                        "Daily Wellness Log",
                        "Take a moment to record today's hydration, sleep, energy, and mood.",
                        userToday,
                        userToday.atTime(23, 59, 59)
                );
            }
        }

        // 2. Hydration Reminder (Water)
        // waking hours only (10:00 to 20:00 local time)
        if (!userLocalTime.isBefore(LocalTime.of(10, 0)) && userLocalTime.isBefore(LocalTime.of(20, 0))) {
            Integer waterLogged = wellnessRecordRepository.findByUserIdAndRecordDate(user.getId(), userToday)
                    .map(WellnessRecord::getWaterIntake)
                    .orElse(0);

            // Default personal goal (2000 ml)
            int goal = 2000; 
            if (waterLogged < goal) {
                notificationService.createNotification(
                        user,
                        "WATER_REMINDER",
                        "Stay Hydrated",
                        "Remember to track your water logs today to stay close to your personal goals.",
                        userToday,
                        userToday.atTime(22, 0)
                );
            }
        }

        // 3. Period Approaching Reminder
        Map<String, Object> cycleState = cycleService.getCurrentCycleState(user);
        if (cycleState != null && cycleState.get("averageCycleLength") != null) {
            Integer currentDay = (Integer) cycleState.get("currentCycleDay");
            Integer avgCycleLength = (Integer) cycleState.get("averageCycleLength");
            if (currentDay != null && avgCycleLength != null) {
                // If within 3 days of expected period
                if (currentDay >= (avgCycleLength - 2)) {
                    notificationService.createNotification(
                            user,
                            "PERIOD_REMINDER",
                            "Cycle Reminder",
                            "Your period may be approaching.",
                            userToday,
                            userToday.plusDays(3).atTime(23, 59, 59)
                    );
                }
            }
        }
    }
}
