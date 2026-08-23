package com.nura.service;

import com.nura.model.PeriodRecord;
import com.nura.model.User;
import com.nura.model.UserProfile;
import com.nura.repository.PeriodRecordRepository;
import com.nura.repository.UserProfileRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class CycleService {

    private final PeriodRecordRepository periodRecordRepository;
    private final UserProfileRepository userProfileRepository;

    public CycleService(PeriodRecordRepository periodRecordRepository,
                        UserProfileRepository userProfileRepository) {
        this.periodRecordRepository = periodRecordRepository;
        this.userProfileRepository = userProfileRepository;
    }

    private ZoneId getUserZoneId(User user) {
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
     * Calculate current cycle status and statistics for the user based on their timezone.
     */
    public Map<String, Object> getCurrentCycleState(User user) {
        ZoneId userZone = getUserZoneId(user);
        LocalDate today = LocalDate.now(userZone);

        UserProfile profile = userProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalStateException("UserProfile missing for active user."));

        List<PeriodRecord> records = periodRecordRepository.findByUserIdOrderByStartDateAsc(user.getId());

        Map<String, Object> result = new HashMap<>();
        result.put("timezone", profile.getTimezone());
        result.put("typicalCycleLength", profile.getTypicalCycleLength());
        result.put("typicalPeriodDuration", profile.getTypicalPeriodDuration());
        result.put("onboardingStatus", profile.getOnboardingStatus());

        if (records.isEmpty()) {
            result.put("currentCycleDay", null);
            result.put("periodStatus", "NONE");
            result.put("daysSincePeriodEnded", null);
            result.put("hasRecordedAverages", false);
            result.put("recordedAverageCycleLength", null);
            result.put("recordedAveragePeriodDuration", null);
            return result;
        }

        // Retrieve latest record
        PeriodRecord latest = records.get(records.size() - 1);
        
        // Calculate current cycle day (relative to start of latest period)
        long cycleDay = ChronoUnit.DAYS.between(latest.getStartDate(), today) + 1;
        result.put("currentCycleDay", cycleDay > 0 ? cycleDay : 1);

        // Determine period status (ONGOING, ENDED, or NONE)
        String periodStatus = "NONE";
        Long daysSincePeriodEnded = null;

        if (latest.getEndDate() == null) {
            periodStatus = "ONGOING";
        } else {
            if (!today.isBefore(latest.getStartDate()) && !today.isAfter(latest.getEndDate())) {
                periodStatus = "ONGOING";
            } else if (today.isAfter(latest.getEndDate())) {
                periodStatus = "ENDED";
                daysSincePeriodEnded = ChronoUnit.DAYS.between(latest.getEndDate(), today);
            }
        }
        result.put("periodStatus", periodStatus);
        result.put("daysSincePeriodEnded", daysSincePeriodEnded);

        // Calculate Recorded Averages
        // To display actual recorded averages, we require at least 2 completed period records
        long completedPeriodCount = records.stream()
                .filter(r -> r.getEndDate() != null)
                .count();

        if (completedPeriodCount >= 2) {
            result.put("hasRecordedAverages", true);

            // 1. Calculate Average Period Duration (completed periods only)
            double avgDuration = records.stream()
                    .filter(r -> r.getEndDate() != null)
                    .mapToLong(r -> ChronoUnit.DAYS.between(r.getStartDate(), r.getEndDate()) + 1)
                    .average()
                    .orElse(profile.getTypicalPeriodDuration());
            result.put("recordedAveragePeriodDuration", (int) Math.round(avgDuration));

            // 2. Calculate Average Cycle Length (days between consecutive start dates)
            if (records.size() >= 2) {
                long totalCycleDays = 0;
                int cycleCount = 0;
                for (int i = 0; i < records.size() - 1; i++) {
                    PeriodRecord curr = records.get(i);
                    PeriodRecord next = records.get(i + 1);
                    totalCycleDays += ChronoUnit.DAYS.between(curr.getStartDate(), next.getStartDate());
                    cycleCount++;
                }
                if (cycleCount > 0) {
                    double avgCycle = (double) totalCycleDays / cycleCount;
                    result.put("recordedAverageCycleLength", (int) Math.round(avgCycle));
                } else {
                    result.put("recordedAverageCycleLength", null);
                }
            } else {
                result.put("recordedAverageCycleLength", null);
            }
        } else {
            result.put("hasRecordedAverages", false);
            result.put("recordedAverageCycleLength", null);
            result.put("recordedAveragePeriodDuration", null);
        }

        return result;
    }
}
