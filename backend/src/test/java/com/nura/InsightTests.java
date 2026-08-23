package com.nura;

import com.nura.dto.WellnessRecordDto;
import com.nura.model.User;
import com.nura.model.UserProfile;
import com.nura.model.WellnessRecord;
import com.nura.repository.UserProfileRepository;
import com.nura.repository.UserRepository;
import com.nura.repository.WellnessRecordRepository;
import com.nura.service.InsightService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class InsightTests {

    @Autowired
    private InsightService insightService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private WellnessRecordRepository wellnessRecordRepository;

    private User primaryUser;
    private User secondaryUser;

    @BeforeEach
    void setUp() {
        wellnessRecordRepository.deleteAll();
        userProfileRepository.deleteAll();
        userRepository.deleteAll();

        primaryUser = userRepository.save(new User("+919000000006", "ACTIVE"));
        userProfileRepository.save(new UserProfile(primaryUser, "COMPLETED"));

        secondaryUser = userRepository.save(new User("+919000000007", "ACTIVE"));
        userProfileRepository.save(new UserProfile(secondaryUser, "COMPLETED"));
    }

    private void saveRecord(User u, LocalDate date, Integer water, Integer sleepMinutes, String mood, List<String> symptoms) {
        WellnessRecord r = new WellnessRecord(u, date);
        r.setWaterIntake(water);
        r.setSleepDurationMinutes(sleepMinutes);
        r.setMood(mood);
        r.setSymptoms(symptoms);
        wellnessRecordRepository.save(r);
    }

    @Test
    void testEmptyWellnessRecordsReturnsWarning() {
        // Retrieve insights with no logs registered
        Map<String, Object> summary = insightService.getInsightsSummary(primaryUser, "7d");

        Map<String, Object> coverage = (Map<String, Object>) summary.get("dataCoverage");
        assertEquals(0L, coverage.get("wellnessDays"));

        List<Map<String, String>> cards = (List<Map<String, String>>) summary.get("generatedInsightCards");
        assertEquals(1, cards.size());
        assertEquals("No Data Yet", cards.get(0).get("title"));
        assertEquals("COVERAGE", cards.get(0).get("type"));
        assertEquals("WARNING", cards.get(0).get("level"));
    }

    @Test
    void testSparseRecordsCoverageCard() {
        LocalDate today = LocalDate.now(ZoneId.of("UTC"));
        // Save 2 records (less than threshold of 3 days)
        saveRecord(primaryUser, today, 1000, 420, "HAPPY", null);
        saveRecord(primaryUser, today.minusDays(1), 1200, 480, "CALM", null);

        Map<String, Object> summary = insightService.getInsightsSummary(primaryUser, "7d");
        Map<String, Object> coverage = (Map<String, Object>) summary.get("dataCoverage");
        assertEquals(2L, coverage.get("wellnessDays"));

        List<Map<String, String>> cards = (List<Map<String, String>>) summary.get("generatedInsightCards");
        assertEquals(1, cards.size());
        assertEquals("Not Enough Data Yet", cards.get(0).get("title"));
        assertEquals("COVERAGE", cards.get(0).get("type"));
    }

    @Test
    void testMetricAveragesWithMissingValues() {
        LocalDate today = LocalDate.now(ZoneId.of("UTC"));
        // Save 4 records, but some metrics are null
        saveRecord(primaryUser, today, 1000, 480, "HAPPY", null); // Sleep: 8h, Water: 1000ml
        saveRecord(primaryUser, today.minusDays(1), null, 360, "CALM", null); // Sleep: 6h, Water: null
        saveRecord(primaryUser, today.minusDays(2), 2000, null, null, null); // Sleep: null, Water: 2000ml
        saveRecord(primaryUser, today.minusDays(3), 1500, 540, "SAD", null); // Sleep: 9h, Water: 1500ml

        Map<String, Object> summary = insightService.getInsightsSummary(primaryUser, "7d");
        
        // Assert water average ignores nulls and averages strictly over waterDays (1000 + 2000 + 1500) / 3 = 1500ml
        assertEquals(1500.0, summary.get("averageWaterIntake"));

        // Assert sleep average ignores nulls and averages strictly over sleepDays (8h + 6h + 9h) / 3 = 7.66h
        assertEquals(7.666666666666667, (Double) summary.get("averageSleep"), 0.001);

        Map<String, Object> coverage = (Map<String, Object>) summary.get("dataCoverage");
        assertEquals(4L, coverage.get("wellnessDays"));
        assertEquals(3L, coverage.get("waterDays"));
        assertEquals(3L, coverage.get("sleepDays"));
    }

    @Test
    void testRangeBoundariesExcluded() {
        LocalDate today = LocalDate.now(ZoneId.of("UTC"));

        // Save 3 records inside 7-day range (today, today-1, today-6)
        saveRecord(primaryUser, today, 1000, 480, "HAPPY", null);
        saveRecord(primaryUser, today.minusDays(1), 1000, 480, "CALM", null);
        saveRecord(primaryUser, today.minusDays(6), 1000, 480, "SAD", null);

        // Save 1 record outside 7-day range (today-7)
        saveRecord(primaryUser, today.minusDays(7), 5000, 600, "HAPPY", null);

        Map<String, Object> summary = insightService.getInsightsSummary(primaryUser, "7d");
        Map<String, Object> coverage = (Map<String, Object>) summary.get("dataCoverage");
        
        // Expect coverage = 3 days, since the 4th record falls on Day-7 (outside the offset window)
        assertEquals(3L, coverage.get("wellnessDays"));
        // Expect average water = 1000, ignoring the 5000 ml entry outside the range
        assertEquals(1000.0, summary.get("averageWaterIntake"));
    }

    @Test
    void testDeterministicInsightWordingIsNotCausal() {
        LocalDate today = LocalDate.now(ZoneId.of("UTC"));
        // 3 days recorded (enough for metrics logs insights)
        saveRecord(primaryUser, today, 1000, 360, "HAPPY", null); // Sleep: 6h
        saveRecord(primaryUser, today.minusDays(1), 1000, 360, "CALM", null); // Sleep: 6h
        saveRecord(primaryUser, today.minusDays(2), 1000, 360, "SAD", null); // Sleep: 6h

        Map<String, Object> summary = insightService.getInsightsSummary(primaryUser, "7d");
        List<Map<String, String>> cards = (List<Map<String, String>>) summary.get("generatedInsightCards");

        // Verify sleep card exists
        Optional<Map<String, String>> sleepCardOpt = cards.stream().filter(c -> "SLEEP".equals(c.get("type"))).findFirst();
        assertTrue(sleepCardOpt.isPresent());

        Map<String, String> sleepCard = sleepCardOpt.get();
        assertEquals("Rest Analysis", sleepCard.get("title"));
        // Verify explanation is strictly observational and contains no causal correlations/medical diagnostics
        assertTrue(sleepCard.get("content").contains("You logged an average of 6.0 hours of sleep."));
        assertFalse(sleepCard.get("content").contains("caused by"));
        assertFalse(sleepCard.get("content").contains("due to your"));
    }

    @Test
    void testTimezoneDateTransitions() {
        // Set Auckland timezone
        UserProfile profile = userProfileRepository.findByUserId(primaryUser.getId()).orElseThrow();
        profile.setTimezone("Pacific/Auckland");
        userProfileRepository.save(profile);

        LocalDate aucklandToday = LocalDate.now(ZoneId.of("Pacific/Auckland"));
        // Log a record today Auckland time
        saveRecord(primaryUser, aucklandToday, 2000, 480, "CALM", null);

        Map<String, Object> summary = insightService.getInsightsSummary(primaryUser, "7d");
        Map<String, Object> coverage = (Map<String, Object>) summary.get("dataCoverage");
        assertEquals(1L, coverage.get("wellnessDays"));
    }

    @Test
    void testOwnershipSecurityBoundaries() {
        LocalDate today = LocalDate.now(ZoneId.of("UTC"));
        // Primary user has logs
        saveRecord(primaryUser, today, 1000, 480, "HAPPY", null);
        saveRecord(primaryUser, today.minusDays(1), 1000, 480, "CALM", null);
        saveRecord(primaryUser, today.minusDays(2), 1000, 480, "SAD", null);

        // Secondary user has no logs
        Map<String, Object> secondarySummary = insightService.getInsightsSummary(secondaryUser, "7d");
        Map<String, Object> coverage = (Map<String, Object>) secondarySummary.get("dataCoverage");
        // Secondary user cannot read primary user's logs
        assertEquals(0L, coverage.get("wellnessDays"));
    }
}
