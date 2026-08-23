package com.nura.service;

import com.nura.model.User;
import com.nura.model.UserProfile;
import com.nura.model.WellnessRecord;
import com.nura.repository.UserProfileRepository;
import com.nura.repository.WellnessRecordRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class InsightService {

    private final WellnessRecordRepository wellnessRecordRepository;
    private final UserProfileRepository userProfileRepository;
    private final CycleService cycleService;
    private final CyclePhaseService cyclePhaseService;

    public InsightService(WellnessRecordRepository wellnessRecordRepository,
                          UserProfileRepository userProfileRepository,
                          CycleService cycleService,
                          CyclePhaseService cyclePhaseService) {
        this.wellnessRecordRepository = wellnessRecordRepository;
        this.userProfileRepository = userProfileRepository;
        this.cycleService = cycleService;
        this.cyclePhaseService = cyclePhaseService;
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

    private boolean isTracked(WellnessRecord r) {
        return r.getWaterIntake() != null || 
               r.getMood() != null || 
               r.getEnergyLevel() != null || 
               r.getSleepDurationMinutes() != null || 
               (r.getSymptoms() != null && !r.getSymptoms().isEmpty()) || 
               (r.getNote() != null && !r.getNote().trim().isEmpty());
    }

    /**
     * Compute deterministic insights for the specified range (7d or 30d) in the user's timezone.
     */
    public Map<String, Object> getInsightsSummary(User user, String rangeParam) {
        ZoneId userZone = getUserZoneId(user);
        LocalDate today = LocalDate.now(userZone);

        int rangeDays = "30d".equalsIgnoreCase(rangeParam) ? 30 : 7;
        LocalDate startDate = today.minusDays(rangeDays - 1);
        LocalDate endDate = today;

        List<WellnessRecord> logs = wellnessRecordRepository.findByUserIdAndRecordDateBetweenOrderByRecordDateAsc(
                user.getId(), 
                startDate, 
                endDate
        );

        // 1. Calculate precise dataCoverage object
        long wellnessDays = logs.stream().filter(this::isTracked).count();
        long waterDays = logs.stream().filter(r -> r.getWaterIntake() != null).count();
        long sleepDays = logs.stream().filter(r -> r.getSleepDurationMinutes() != null).count();
        long moodDays = logs.stream().filter(r -> r.getMood() != null).count();
        long energyDays = logs.stream().filter(r -> r.getEnergyLevel() != null).count();
        long symptomDays = logs.stream().filter(r -> r.getSymptoms() != null && !r.getSymptoms().isEmpty()).count();

        Map<String, Object> dataCoverage = new HashMap<>();
        dataCoverage.put("daysInRange", rangeDays);
        dataCoverage.put("wellnessDays", wellnessDays);
        dataCoverage.put("waterDays", waterDays);
        dataCoverage.put("sleepDays", sleepDays);
        dataCoverage.put("moodDays", moodDays);
        dataCoverage.put("energyDays", energyDays);
        dataCoverage.put("symptomDays", symptomDays);

        // 2. Compute averages independently (avoiding treating missing values as zero)
        Double avgWaterIntake = null;
        if (waterDays > 0) {
            avgWaterIntake = logs.stream()
                    .filter(r -> r.getWaterIntake() != null)
                    .mapToDouble(WellnessRecord::getWaterIntake)
                    .average()
                    .orElse(0.0);
        }

        Double avgSleepDurationHours = null;
        if (sleepDays > 0) {
            double avgMins = logs.stream()
                    .filter(r -> r.getSleepDurationMinutes() != null)
                    .mapToDouble(WellnessRecord::getSleepDurationMinutes)
                    .average()
                    .orElse(0.0);
            avgSleepDurationHours = avgMins / 60.0;
        }

        Double wellnessLoggingConsistency = ((double) wellnessDays / rangeDays) * 100.0;

        // 3. Compute distributions descriptively
        Map<String, Integer> moodDistribution = new HashMap<>();
        logs.stream()
                .filter(r -> r.getMood() != null)
                .forEach(r -> {
                    String m = r.getMood().toUpperCase();
                    moodDistribution.put(m, moodDistribution.getOrDefault(m, 0) + 1);
                });

        Map<Integer, Integer> energyDistribution = new HashMap<>();
        logs.stream()
                .filter(r -> r.getEnergyLevel() != null)
                .forEach(r -> {
                    Integer e = r.getEnergyLevel();
                    energyDistribution.put(e, energyDistribution.getOrDefault(e, 0) + 1);
                });

        Map<String, Integer> symptomFrequency = new HashMap<>();
        logs.stream()
                .filter(r -> r.getSymptoms() != null)
                .forEach(r -> {
                    for (String sym : r.getSymptoms()) {
                        String s = sym.toUpperCase();
                        symptomFrequency.put(s, symptomFrequency.getOrDefault(s, 0) + 1);
                    }
                });

        // 4. Retrieve cycle stats
        Map<String, Object> cycleState = cycleService.getCurrentCycleState(user);
        Map<String, Object> phaseState = cyclePhaseService.calculateCyclePhase(user);

        // 5. Generate descriptive insight cards
        List<Map<String, String>> generatedInsightCards = new ArrayList<>();

        if (wellnessDays == 0) {
            Map<String, String> card = new HashMap<>();
            card.put("title", "No Data Yet");
            card.put("content", "You haven't logged any daily wellness metrics in this range. Tap the Wellness Log to record your water, sleep, mood, or symptoms.");
            card.put("type", "COVERAGE");
            card.put("level", "WARNING");
            generatedInsightCards.add(card);
        } else if (wellnessDays < 3) {
            Map<String, String> card = new HashMap<>();
            card.put("title", "Not Enough Data Yet");
            card.put("content", "Continue logging your daily wellness check-ins. We need at least 3 tracked days in this range to compile trend insights.");
            card.put("type", "COVERAGE");
            card.put("level", "INFO");
            generatedInsightCards.add(card);
        } else {
            // Generate Hydration card
            if (waterDays >= 3 && avgWaterIntake != null) {
                Map<String, String> card = new HashMap<>();
                card.put("type", "WATER");
                int roundedWater = (int) Math.round(avgWaterIntake);
                if (avgWaterIntake < 1500) {
                    card.put("title", "Hydration Observation");
                    card.put("content", "Your logged water intake averaged " + roundedWater + " ml on tracked days. Consuming sufficient water supports daily cellular function and hydration levels.");
                    card.put("level", "INFO");
                } else {
                    card.put("title", "Optimal Hydration");
                    card.put("content", "Great job! You maintained a healthy average water intake of " + roundedWater + " ml on tracked days in this range.");
                    card.put("level", "SUCCESS");
                }
                generatedInsightCards.add(card);
            }

            // Generate Sleep card
            if (sleepDays >= 3 && avgSleepDurationHours != null) {
                Map<String, String> card = new HashMap<>();
                card.put("type", "SLEEP");
                if (avgSleepDurationHours < 7.0) {
                    card.put("title", "Rest Analysis");
                    card.put("content", "You logged an average of " + String.format("%.1f", avgSleepDurationHours) + " hours of sleep. Consistent rest supports metabolic balance and mental focus.");
                    card.put("level", "INFO");
                } else {
                    card.put("title", "Healthy Rest Patterns");
                    card.put("content", "You maintained a consistent average of " + String.format("%.1f", avgSleepDurationHours) + " hours of sleep on tracked days.");
                    card.put("level", "SUCCESS");
                }
                generatedInsightCards.add(card);
            }

            // Generate Mood card
            if (moodDays >= 3 && !moodDistribution.isEmpty()) {
                Map<String, String> card = new HashMap<>();
                card.put("type", "MOOD");
                String topMood = Collections.max(moodDistribution.entrySet(), Map.Entry.comparingByValue()).getKey();
                int count = moodDistribution.get(topMood);
                card.put("title", "Mood Logging Distribution");
                card.put("content", "Your most frequently logged mood in this range was " + topMood + " (tracked on " + count + " days). Note how your feelings compare across days.");
                card.put("level", "INFO");
                generatedInsightCards.add(card);
            }

            // Generate Energy card
            if (energyDays >= 3 && !energyDistribution.isEmpty()) {
                Map<String, String> card = new HashMap<>();
                card.put("type", "ENERGY");
                double avgEnergy = logs.stream()
                        .filter(r -> r.getEnergyLevel() != null)
                        .mapToDouble(WellnessRecord::getEnergyLevel)
                        .average()
                        .orElse(3.0);
                card.put("title", "Vitality Metrics");
                card.put("content", "Your logged energy levels averaged " + String.format("%.1f", avgEnergy) + "/5 in this range. A tracking routine helps map typical vitality markers.");
                card.put("level", "INFO");
                generatedInsightCards.add(card);
            }

            // Generate Symptoms card
            if (symptomDays >= 3 && !symptomFrequency.isEmpty()) {
                Map<String, String> card = new HashMap<>();
                card.put("type", "SYMPTOMS");
                String topSymptom = Collections.max(symptomFrequency.entrySet(), Map.Entry.comparingByValue()).getKey();
                int count = symptomFrequency.get(topSymptom);
                card.put("title", "Symptom Logging Frequency");
                card.put("content", "Your most frequently logged symptom in this range was " + topSymptom.replace("_", " ") + " (tracked on " + count + " days).");
                card.put("level", "INFO");
                generatedInsightCards.add(card);
            }
        }

        // 6. Map unified payload response
        Map<String, Object> payload = new HashMap<>();
        payload.put("currentLikelyPhase", phaseState.get("phase"));
        payload.put("currentCycleDay", phaseState.get("currentCycleDay"));
        payload.put("wellnessLoggingConsistency", wellnessLoggingConsistency);
        payload.put("averageWaterIntake", avgWaterIntake);
        payload.put("averageSleep", avgSleepDurationHours);
        payload.put("moodDistribution", moodDistribution);
        payload.put("energyDistribution", energyDistribution);
        payload.put("symptomFrequency", symptomFrequency);
        payload.put("cyclePeriodTrends", cycleState);
        payload.put("generatedInsightCards", generatedInsightCards);
        payload.put("dataCoverage", dataCoverage);

        return payload;
    }
}
