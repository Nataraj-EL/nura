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
public class CyclePhaseService {

    private final PeriodRecordRepository periodRecordRepository;
    private final UserProfileRepository userProfileRepository;

    public CyclePhaseService(PeriodRecordRepository periodRecordRepository,
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
     * Compute the deterministic four-phase cycle state based on user's logged data.
     */
    public Map<String, Object> calculateCyclePhase(User user) {
        ZoneId userZone = getUserZoneId(user);
        LocalDate today = LocalDate.now(userZone);

        UserProfile profile = userProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalStateException("UserProfile missing for active user."));

        List<PeriodRecord> records = periodRecordRepository.findByUserIdOrderByStartDateAsc(user.getId());

        Map<String, Object> result = new HashMap<>();
        
        if (records.isEmpty()) {
            result.put("currentCycleDay", null);
            result.put("phase", "UNKNOWN");
            result.put("phaseStart", null);
            result.put("estimatedPhaseEnd", null);
            result.put("estimationStatus", "NO_DATA");
            result.put("cycleLengthUsed", null);
            result.put("explanation", "No period records logged. Please log a period to calculate cycle phases.");
            return result;
        }

        // 1. Determine cycle length (L) and period duration (P)
        long completedPeriodCount = records.stream()
                .filter(r -> r.getEndDate() != null)
                .count();

        int cycleLength;
        int periodDuration;
        String estimationStatus;

        if (completedPeriodCount >= 2) {
            estimationStatus = "CALCULATED";
            // Calculate Recorded average period duration
            double avgDuration = records.stream()
                    .filter(r -> r.getEndDate() != null)
                    .mapToLong(r -> ChronoUnit.DAYS.between(r.getStartDate(), r.getEndDate()) + 1)
                    .average()
                    .orElse(profile.getTypicalPeriodDuration());
            periodDuration = (int) Math.round(avgDuration);

            // Calculate Recorded average cycle length
            long totalCycleDays = 0;
            int cycleCount = 0;
            for (int i = 0; i < records.size() - 1; i++) {
                PeriodRecord curr = records.get(i);
                PeriodRecord next = records.get(i + 1);
                totalCycleDays += ChronoUnit.DAYS.between(curr.getStartDate(), next.getStartDate());
                cycleCount++;
            }
            if (cycleCount > 0) {
                cycleLength = (int) Math.round((double) totalCycleDays / cycleCount);
            } else {
                cycleLength = profile.getTypicalCycleLength();
            }
        } else {
            estimationStatus = "ESTIMATED";
            cycleLength = profile.getTypicalCycleLength();
            periodDuration = profile.getTypicalPeriodDuration();
        }

        // 2. Sanitize and Validate inputs to prevent overlap/out-of-bounds calculations
        cycleLength = Math.max(15, Math.min(100, cycleLength));
        periodDuration = Math.max(1, Math.min(20, periodDuration));
        if (periodDuration >= cycleLength - 5) {
            periodDuration = cycleLength - 5; // Enforce gap of at least 5 days for subsequent phases
        }

        // 3. Define contiguity phase boundary rules (encapsulated)
        int mStart = 1;
        int mEnd = periodDuration;

        int fStart = mEnd + 1;
        int fEnd = Math.max(mEnd, cycleLength - 16);

        int oStart = fEnd + 1;
        int oEnd = Math.max(fEnd + 1, cycleLength - 12);

        int lStart = oEnd + 1;
        int lEnd = cycleLength;

        // 4. Calculate current cycle day and current phase
        PeriodRecord latest = records.get(records.size() - 1);
        LocalDate cycleStart = latest.getStartDate();
        long cycleDay = ChronoUnit.DAYS.between(cycleStart, today) + 1;
        
        // Handle negative days gracefully if start date is in a different zone boundary
        if (cycleDay < 1) {
            cycleDay = 1;
        }

        String phaseName;
        LocalDate phaseStartDate;
        LocalDate phaseEndDate;

        if (cycleDay <= mEnd) {
            phaseName = "Likely Menstrual Phase";
            phaseStartDate = cycleStart.plusDays(mStart - 1);
            phaseEndDate = cycleStart.plusDays(mEnd - 1);
        } else if (cycleDay <= fEnd) {
            phaseName = "Likely Follicular Phase";
            phaseStartDate = cycleStart.plusDays(fStart - 1);
            phaseEndDate = cycleStart.plusDays(fEnd - 1);
        } else if (cycleDay <= oEnd) {
            phaseName = "Estimated Ovulatory Window";
            phaseStartDate = cycleStart.plusDays(oStart - 1);
            phaseEndDate = cycleStart.plusDays(oEnd - 1);
        } else {
            phaseName = "Likely Luteal Phase";
            phaseStartDate = cycleStart.plusDays(lStart - 1);
            // Luteal phase estimated end is the expected end of the cycle length used
            phaseEndDate = cycleStart.plusDays(lEnd - 1);
            // If the user is currently past their expected cycle length, shift estimated end date to today or cycleDay
            if (cycleDay > lEnd) {
                phaseEndDate = cycleStart.plusDays(cycleDay - 1);
            }
        }

        result.put("currentCycleDay", cycleDay);
        result.put("phase", phaseName);
        result.put("phaseStart", phaseStartDate);
        result.put("estimatedPhaseEnd", phaseEndDate);
        result.put("estimationStatus", estimationStatus);
        result.put("cycleLengthUsed", cycleLength);
        
        String explBase = "This is a simplified calendar estimation model based on your ";
        if (estimationStatus.equals("CALCULATED")) {
            explBase += "logged average cycle length of " + cycleLength + " days. ";
        } else {
            explBase += "onboarding typical cycle estimate of " + cycleLength + " days. ";
        }
        explBase += "Important: Calendar estimation cannot biologically confirm ovulation or detect biological phase transitions.";
        result.put("explanation", explBase);

        return result;
    }
}
