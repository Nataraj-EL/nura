package com.nura;

import com.nura.dto.PeriodRecordDto;
import com.nura.model.User;
import com.nura.model.UserProfile;
import com.nura.repository.PeriodRecordRepository;
import com.nura.repository.UserProfileRepository;
import com.nura.repository.UserRepository;
import com.nura.service.CyclePhaseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class CyclePhaseTests {

    @Autowired
    private CyclePhaseService cyclePhaseService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private PeriodRecordRepository periodRecordRepository;

    private User testUser;
    private UserProfile testProfile;

    @BeforeEach
    void setUp() {
        periodRecordRepository.deleteAll();
        userProfileRepository.deleteAll();
        userRepository.deleteAll();

        testUser = userRepository.save(new User("+919000000003", "ACTIVE"));
        testProfile = userProfileRepository.save(new UserProfile(testUser, "COMPLETED"));
        testProfile.setTypicalCycleLength(28);
        testProfile.setTypicalPeriodDuration(5);
        testProfile.setTimezone("UTC");
        userProfileRepository.save(testProfile);
    }

    private void logPeriod(LocalDate start, LocalDate end) {
        PeriodRecordDto dto = new PeriodRecordDto();
        dto.setStartDate(start);
        dto.setEndDate(end);
        // Direct save to bypass service limits in manual history seeding
        com.nura.model.PeriodRecord p = new com.nura.model.PeriodRecord(testUser, start, end);
        periodRecordRepository.save(p);
    }

    @Test
    void testBoundaryAndPhaseResolutionsStandardCycle() {
        LocalDate today = LocalDate.now(ZoneId.of("UTC"));
        
        // Let's test different cycle days on a standard 28-day cycle, period duration = 5
        // Menstrual Phase (Days 1 to 5)
        // Day 1
        logPeriod(today, null); // starts today -> cycle day = 1
        Map<String, Object> state = cyclePhaseService.calculateCyclePhase(testUser);
        assertEquals("Likely Menstrual Phase", state.get("phase"));
        assertEquals(1L, state.get("currentCycleDay"));

        // Day 5 (last day of menstrual, first boundary)
        periodRecordRepository.deleteAll();
        logPeriod(today.minusDays(4), null); // starts 4 days ago -> cycle day = 5
        state = cyclePhaseService.calculateCyclePhase(testUser);
        assertEquals("Likely Menstrual Phase", state.get("phase"));
        assertEquals(5L, state.get("currentCycleDay"));

        // Follicular Phase (Days 6 to 12)
        // Day 6 (day immediately after boundary, first day of follicular)
        periodRecordRepository.deleteAll();
        logPeriod(today.minusDays(5), null); // starts 5 days ago -> cycle day = 6
        state = cyclePhaseService.calculateCyclePhase(testUser);
        assertEquals("Likely Follicular Phase", state.get("phase"));
        assertEquals(6L, state.get("currentCycleDay"));

        // Day 12 (last day of follicular, second boundary)
        periodRecordRepository.deleteAll();
        logPeriod(today.minusDays(11), null); // starts 11 days ago -> cycle day = 12
        state = cyclePhaseService.calculateCyclePhase(testUser);
        assertEquals("Likely Follicular Phase", state.get("phase"));
        assertEquals(12L, state.get("currentCycleDay"));

        // Ovulatory Phase (Days 13 to 16)
        // Day 13 (day immediately after boundary, first day of ovulatory)
        periodRecordRepository.deleteAll();
        logPeriod(today.minusDays(12), null); // starts 12 days ago -> cycle day = 13
        state = cyclePhaseService.calculateCyclePhase(testUser);
        assertEquals("Estimated Ovulatory Window", state.get("phase"));
        assertEquals(13L, state.get("currentCycleDay"));

        // Day 16 (last day of ovulatory, third boundary)
        periodRecordRepository.deleteAll();
        logPeriod(today.minusDays(15), null); // starts 15 days ago -> cycle day = 16
        state = cyclePhaseService.calculateCyclePhase(testUser);
        assertEquals("Estimated Ovulatory Window", state.get("phase"));
        assertEquals(16L, state.get("currentCycleDay"));

        // Luteal Phase (Days 17 to 28+)
        // Day 17 (day immediately after boundary, first day of luteal)
        periodRecordRepository.deleteAll();
        logPeriod(today.minusDays(16), null); // starts 16 days ago -> cycle day = 17
        state = cyclePhaseService.calculateCyclePhase(testUser);
        assertEquals("Likely Luteal Phase", state.get("phase"));
        assertEquals(17L, state.get("currentCycleDay"));

        // Day 28 (last day of expected cycle length)
        periodRecordRepository.deleteAll();
        logPeriod(today.minusDays(27), null); // starts 27 days ago -> cycle day = 28
        state = cyclePhaseService.calculateCyclePhase(testUser);
        assertEquals("Likely Luteal Phase", state.get("phase"));
        assertEquals(28L, state.get("currentCycleDay"));

        // Day 29 (past expected cycle length)
        periodRecordRepository.deleteAll();
        logPeriod(today.minusDays(28), null); // starts 28 days ago -> cycle day = 29
        state = cyclePhaseService.calculateCyclePhase(testUser);
        assertEquals("Likely Luteal Phase", state.get("phase"));
        assertEquals(29L, state.get("currentCycleDay"));
    }

    @Test
    void testDifferentCycleLengthsAndPeriodDurations() {
        LocalDate today = LocalDate.now(ZoneId.of("UTC"));

        // Short Cycle: L = 21, P = 3
        testProfile.setTypicalCycleLength(21);
        testProfile.setTypicalPeriodDuration(3);
        userProfileRepository.save(testProfile);

        // Day 4 (start of follicular since P=3)
        logPeriod(today.minusDays(3), null);
        Map<String, Object> state = cyclePhaseService.calculateCyclePhase(testUser);
        assertEquals(21, state.get("cycleLengthUsed"));
        assertEquals(4L, state.get("currentCycleDay"));
        // L=21, P=3 -> Menstrual = 1 to 3; Follicular = 4 to max(3, 5) = 5; Ovulatory = 6 to 9; Luteal = 10 to 21.
        assertEquals("Likely Follicular Phase", state.get("phase"));

        // Long Cycle: L = 35, P = 7
        periodRecordRepository.deleteAll();
        testProfile.setTypicalCycleLength(35);
        testProfile.setTypicalPeriodDuration(7);
        userProfileRepository.save(testProfile);

        // Day 22 (L=35, P=7 -> Menstrual = 1 to 7; Follicular = 8 to 19; Ovulatory = 20 to 23; Luteal = 24 to 35)
        logPeriod(today.minusDays(21), null); // Day 22
        state = cyclePhaseService.calculateCyclePhase(testUser);
        assertEquals(35, state.get("cycleLengthUsed"));
        assertEquals(22L, state.get("currentCycleDay"));
        assertEquals("Estimated Ovulatory Window", state.get("phase"));
    }

    @Test
    void testInputSanitizationAndExtremeValues() {
        LocalDate today = LocalDate.now(ZoneId.of("UTC"));

        // Invalid extreme: L = 10 (too short), P = 12 (P >= L)
        testProfile.setTypicalCycleLength(10);
        testProfile.setTypicalPeriodDuration(12);
        userProfileRepository.save(testProfile);

        logPeriod(today.minusDays(2), null); // Day 3
        Map<String, Object> state = cyclePhaseService.calculateCyclePhase(testUser);
        
        // Sanitizer: L should be bumped to min 15.
        // P should be capped to L - 5 = 15 - 5 = 10.
        assertEquals(15, state.get("cycleLengthUsed"));
        assertEquals(3L, state.get("currentCycleDay"));
        // Since P is capped at 10, Day 3 is within Menstrual [1, 10]
        assertEquals("Likely Menstrual Phase", state.get("phase"));
    }

    @Test
    void testHistoryFallbackAverages() {
        LocalDate today = LocalDate.now(ZoneId.of("UTC"));

        // Insufficient history fallback (only 1 completed period record)
        logPeriod(today.minusDays(40), today.minusDays(35));
        logPeriod(today.minusDays(10), null); // latest starting 10 days ago (ongoing)

        Map<String, Object> state = cyclePhaseService.calculateCyclePhase(testUser);
        // Only 1 completed period logged (first one), so should fallback to typical profile estimates
        assertEquals("ESTIMATED", state.get("estimationStatus"));
        assertEquals(28, state.get("cycleLengthUsed"));

        // Sufficient history (2 completed periods: first at Day -60 to -55, second at Day -30 to -26, latest starting today)
        periodRecordRepository.deleteAll();
        logPeriod(today.minusDays(60), today.minusDays(55)); // complete
        logPeriod(today.minusDays(30), today.minusDays(26)); // complete
        logPeriod(today, null); // latest (ongoing)

        state = cyclePhaseService.calculateCyclePhase(testUser);
        // Has 2 completed periods, so recorded averages should trigger
        // Recorded cycle length = 60 - 30 = 30 days. Average period duration = (6 + 5) / 2 = 5 days
        assertEquals("CALCULATED", state.get("estimationStatus"));
        assertEquals(30, state.get("cycleLengthUsed"));
    }

    @Test
    void testUserTimezoneHandling() {
        // Configure user in a different timezone (UTC + 12:00, Asia/Anadyr or Pacific/Auckland)
        testProfile.setTimezone("Pacific/Auckland");
        userProfileRepository.save(testProfile);

        // Period starting yesterday UTC (which is today in Auckland)
        LocalDate aucklandToday = LocalDate.now(ZoneId.of("Pacific/Auckland"));
        logPeriod(aucklandToday.minusDays(2), null);

        Map<String, Object> state = cyclePhaseService.calculateCyclePhase(testUser);
        assertNotNull(state.get("currentCycleDay"));
        // Days since start + 1
        assertEquals(3L, state.get("currentCycleDay"));
    }
}
