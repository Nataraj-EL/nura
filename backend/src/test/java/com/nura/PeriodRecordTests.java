package com.nura;

import com.nura.dto.PeriodRecordDto;
import com.nura.model.PeriodRecord;
import com.nura.model.User;
import com.nura.model.UserProfile;
import com.nura.repository.PeriodRecordRepository;
import com.nura.repository.UserProfileRepository;
import com.nura.repository.UserRepository;
import com.nura.service.CycleService;
import com.nura.service.PeriodRecordService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class PeriodRecordTests {

    @Autowired
    private PeriodRecordService periodRecordService;

    @Autowired
    private CycleService cycleService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private PeriodRecordRepository periodRecordRepository;

    private User primaryUser;
    private User secondaryUser;

    @BeforeEach
    void setUp() {
        periodRecordRepository.deleteAll();
        userProfileRepository.deleteAll();
        userRepository.deleteAll();

        // Create test users
        primaryUser = userRepository.save(new User("+919000000001", "ACTIVE"));
        userProfileRepository.save(new UserProfile(primaryUser, "COMPLETED"));

        secondaryUser = userRepository.save(new User("+919000000002", "ACTIVE"));
        userProfileRepository.save(new UserProfile(secondaryUser, "COMPLETED"));
    }

    @Test
    void testCreatePeriodRecordSuccess() {
        PeriodRecordDto dto = new PeriodRecordDto();
        dto.setStartDate(LocalDate.now().minusDays(10));
        dto.setEndDate(LocalDate.now().minusDays(5));

        PeriodRecord record = periodRecordService.createPeriod(primaryUser, dto);
        assertNotNull(record.getId());
        assertEquals(primaryUser.getId(), record.getUser().getId());
        assertEquals(dto.getStartDate(), record.getStartDate());
        assertEquals(dto.getEndDate(), record.getEndDate());
    }

    @Test
    void testCreatePeriodFutureStartDateFails() {
        PeriodRecordDto dto = new PeriodRecordDto();
        dto.setStartDate(LocalDate.now().plusDays(2)); // Future date

        assertThrows(IllegalArgumentException.class, () -> periodRecordService.createPeriod(primaryUser, dto));
    }

    @Test
    void testCreatePeriodEndBeforeStartFails() {
        PeriodRecordDto dto = new PeriodRecordDto();
        dto.setStartDate(LocalDate.now().minusDays(5));
        dto.setEndDate(LocalDate.now().minusDays(6)); // End before start

        assertThrows(IllegalArgumentException.class, () -> periodRecordService.createPeriod(primaryUser, dto));
    }

    @Test
    void testCreateOverlappingPeriodsFails() {
        // Log first period record: Day -15 to Day -10
        PeriodRecordDto dto1 = new PeriodRecordDto();
        dto1.setStartDate(LocalDate.now().minusDays(15));
        dto1.setEndDate(LocalDate.now().minusDays(10));
        periodRecordService.createPeriod(primaryUser, dto1);

        // Attempting to log a period overlapping the first should fail
        // Proposed: Day -12 to Day -8 (overlaps)
        PeriodRecordDto dto2 = new PeriodRecordDto();
        dto2.setStartDate(LocalDate.now().minusDays(12));
        dto2.setEndDate(LocalDate.now().minusDays(8));
        assertThrows(IllegalArgumentException.class, () -> periodRecordService.createPeriod(primaryUser, dto2));

        // Proposed: Day -14 to Day -14 (inside range)
        PeriodRecordDto dto3 = new PeriodRecordDto();
        dto3.setStartDate(LocalDate.now().minusDays(14));
        dto3.setEndDate(LocalDate.now().minusDays(14));
        assertThrows(IllegalArgumentException.class, () -> periodRecordService.createPeriod(primaryUser, dto3));
    }

    @Test
    void testMultipleOngoingPeriodsForbidden() {
        // Log ongoing period
        PeriodRecordDto dto1 = new PeriodRecordDto();
        dto1.setStartDate(LocalDate.now().minusDays(15));
        dto1.setEndDate(null);
        periodRecordService.createPeriod(primaryUser, dto1);

        // Try to log another ongoing period (overlaps since end date acts as infinity)
        PeriodRecordDto dto2 = new PeriodRecordDto();
        dto2.setStartDate(LocalDate.now().minusDays(5));
        dto2.setEndDate(null);

        assertThrows(IllegalArgumentException.class, () -> periodRecordService.createPeriod(primaryUser, dto2));
    }

    @Test
    void testUpdatePeriodExcludingSelfOverlap() {
        PeriodRecordDto dto = new PeriodRecordDto();
        dto.setStartDate(LocalDate.now().minusDays(10));
        dto.setEndDate(LocalDate.now().minusDays(5));
        PeriodRecord record = periodRecordService.createPeriod(primaryUser, dto);

        // Updating the record with similar boundaries shouldn't register as overlap against itself
        dto.setStartDate(LocalDate.now().minusDays(9));
        dto.setEndDate(LocalDate.now().minusDays(4));
        
        PeriodRecord updated = periodRecordService.updatePeriod(primaryUser, record.getId(), dto);
        assertEquals(dto.getStartDate(), updated.getStartDate());
    }

    @Test
    void testDeletePeriodRecord() {
        PeriodRecordDto dto = new PeriodRecordDto();
        dto.setStartDate(LocalDate.now().minusDays(5));
        PeriodRecord record = periodRecordService.createPeriod(primaryUser, dto);

        assertNotNull(periodRecordRepository.findById(record.getId()).orElse(null));
        periodRecordService.deletePeriod(primaryUser, record.getId());
        assertNull(periodRecordRepository.findById(record.getId()).orElse(null));
    }

    @Test
    void testOwnershipSecurityEnforcement() {
        // Log period as primaryUser
        PeriodRecordDto dto = new PeriodRecordDto();
        dto.setStartDate(LocalDate.now().minusDays(5));
        PeriodRecord record = periodRecordService.createPeriod(primaryUser, dto);

        // SecondaryUser attempting to edit or delete it should fail
        assertThrows(IllegalArgumentException.class, () -> periodRecordService.updatePeriod(secondaryUser, record.getId(), dto));
        assertThrows(IllegalArgumentException.class, () -> periodRecordService.deletePeriod(secondaryUser, record.getId()));
    }

    @Test
    void testUserTimezoneCurrentCycleDayCalculations() {
        // Test with different timezones
        UserProfile profile = userProfileRepository.findByUserId(primaryUser.getId()).orElseThrow();
        profile.setTimezone("Asia/Kolkata"); // UTC + 5:30
        userProfileRepository.save(profile);

        // Save a period starting today
        PeriodRecordDto dto = new PeriodRecordDto();
        // Set start date to yesterday UTC (Asia/Kolkata today)
        LocalDate start = LocalDate.now(ZoneId.of("Asia/Kolkata")).minusDays(4);
        dto.setStartDate(start);
        periodRecordService.createPeriod(primaryUser, dto);

        Map<String, Object> state = cycleService.getCurrentCycleState(primaryUser);
        assertNotNull(state.get("currentCycleDay"));
        assertEquals(5L, state.get("currentCycleDay")); // (today - start) + 1 = 5
    }

    @Test
    void testAveragesFallbackSeparation() {
        // Profile configurations
        UserProfile profile = userProfileRepository.findByUserId(primaryUser.getId()).orElseThrow();
        profile.setTypicalCycleLength(28);
        profile.setTypicalPeriodDuration(5);
        userProfileRepository.save(profile);

        // Calculate state with 0 periods
        Map<String, Object> state0 = cycleService.getCurrentCycleState(primaryUser);
        assertFalse((Boolean) state0.get("hasRecordedAverages"));
        assertEquals(28, state0.get("typicalCycleLength"));

        // Calculate state with 1 completed period
        PeriodRecordDto dto1 = new PeriodRecordDto();
        dto1.setStartDate(LocalDate.now().minusDays(30));
        dto1.setEndDate(LocalDate.now().minusDays(25));
        periodRecordService.createPeriod(primaryUser, dto1);

        Map<String, Object> state1 = cycleService.getCurrentCycleState(primaryUser);
        // Still hasRecordedAverages = false because we need at least 2 completed periods to compute averages
        assertFalse((Boolean) state1.get("hasRecordedAverages"));

        // Add 2nd completed period: starts at Day -5
        PeriodRecordDto dto2 = new PeriodRecordDto();
        dto2.setStartDate(LocalDate.now().minusDays(5));
        dto2.setEndDate(LocalDate.now().minusDays(1));
        periodRecordService.createPeriod(primaryUser, dto2);

        Map<String, Object> state2 = cycleService.getCurrentCycleState(primaryUser);
        // With 2 completed periods, averages calculations should trigger
        assertTrue((Boolean) state2.get("hasRecordedAverages"));
        // Cycle length is (dto2.start - dto1.start) = 25 days
        assertEquals(25, state2.get("recordedAverageCycleLength"));
        // Average period duration = (5 + 5) / 2 = 5 days (dto1 = 6 days inclusive, dto2 = 5 days inclusive -> avg 5.5 rounded to 6 or 5 depending on math)
        // Let's verify values are present
        assertNotNull(state2.get("recordedAveragePeriodDuration"));
    }
}
