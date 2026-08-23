package com.nura;

import com.nura.dto.WellnessRecordDto;
import com.nura.model.User;
import com.nura.model.UserProfile;
import com.nura.model.WellnessRecord;
import com.nura.repository.UserProfileRepository;
import com.nura.repository.UserRepository;
import com.nura.repository.WellnessRecordRepository;
import com.nura.service.WellnessRecordService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class WellnessRecordTests {

    @Autowired
    private WellnessRecordService wellnessRecordService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private WellnessRecordRepository wellnessRecordRepository;

    private User userPrimary;
    private User userSecondary;

    @BeforeEach
    void setUp() {
        wellnessRecordRepository.deleteAll();
        userProfileRepository.deleteAll();
        userRepository.deleteAll();

        userPrimary = userRepository.save(new User("+919000000004", "ACTIVE"));
        userProfileRepository.save(new UserProfile(userPrimary, "COMPLETED"));

        userSecondary = userRepository.save(new User("+919000000005", "ACTIVE"));
        userProfileRepository.save(new UserProfile(userSecondary, "COMPLETED"));
    }

    @Test
    void testCreateDailyWellnessRecord() {
        LocalDate today = LocalDate.now(ZoneId.of("UTC"));

        WellnessRecordDto dto = new WellnessRecordDto();
        dto.setWaterIntake(1500);
        dto.setMood("HAPPY");
        dto.setEnergyLevel(4);
        dto.setSleepDurationMinutes(480); // 8 hours
        dto.setSymptoms(Arrays.asList("HEADACHE", "FATIGUE"));
        dto.setNote("Felt slightly tired in the morning.");

        WellnessRecord record = wellnessRecordService.saveOrUpdateRecord(userPrimary, today, dto);

        assertNotNull(record.getId());
        assertEquals(userPrimary.getId(), record.getUser().getId());
        assertEquals(today, record.getRecordDate());
        assertEquals(1500, record.getWaterIntake());
        assertEquals("HAPPY", record.getMood());
        assertEquals(4, record.getEnergyLevel());
        assertEquals(480, record.getSleepDurationMinutes());
        assertTrue(record.getSymptoms().contains("HEADACHE"));
        assertEquals("Felt slightly tired in the morning.", record.getNote());
    }

    @Test
    void testPartialUpdatesPreservesFields() {
        LocalDate today = LocalDate.now(ZoneId.of("UTC"));

        // Stage 1: Log mood & energy
        WellnessRecordDto dto1 = new WellnessRecordDto();
        dto1.setMood("CALM");
        dto1.setEnergyLevel(3);
        wellnessRecordService.saveOrUpdateRecord(userPrimary, today, dto1);

        // Stage 2: Log water intake only (partial update)
        WellnessRecordDto dto2 = new WellnessRecordDto();
        dto2.setWaterIntake(1000);
        WellnessRecord updated = wellnessRecordService.saveOrUpdateRecord(userPrimary, today, dto2);

        // Water updated, mood & energy preserved!
        assertEquals(1000, updated.getWaterIntake());
        assertEquals("CALM", updated.getMood());
        assertEquals(3, updated.getEnergyLevel());
    }

    @Test
    void testUniqueRecordPerUserPerDate() {
        LocalDate today = LocalDate.now(ZoneId.of("UTC"));

        // First creation
        WellnessRecordDto dto1 = new WellnessRecordDto();
        dto1.setWaterIntake(500);
        wellnessRecordService.saveOrUpdateRecord(userPrimary, today, dto1);

        // Secondary update on the same date should update, not create new rows
        WellnessRecordDto dto2 = new WellnessRecordDto();
        dto2.setWaterIntake(1200);
        wellnessRecordService.saveOrUpdateRecord(userPrimary, today, dto2);

        // Verify only 1 record exists in database
        List<WellnessRecord> allRecords = wellnessRecordRepository.findAll();
        assertEquals(1, allRecords.size());
        assertEquals(1200, allRecords.get(0).getWaterIntake());
    }

    @Test
    void testMoodEnumsValidations() {
        LocalDate today = LocalDate.now(ZoneId.of("UTC"));

        WellnessRecordDto dto = new WellnessRecordDto();
        dto.setMood("ECSTATIC"); // Invalid mood

        assertThrows(IllegalArgumentException.class, () -> wellnessRecordService.saveOrUpdateRecord(userPrimary, today, dto));
    }

    @Test
    void testSymptomEnumsValidations() {
        LocalDate today = LocalDate.now(ZoneId.of("UTC"));

        WellnessRecordDto dto = new WellnessRecordDto();
        dto.setSymptoms(Arrays.asList("HEADACHE", "FEVER")); // FEVER is invalid

        assertThrows(IllegalArgumentException.class, () -> wellnessRecordService.saveOrUpdateRecord(userPrimary, today, dto));
    }

    @Test
    void testDateRangeRetrieval() {
        LocalDate today = LocalDate.now(ZoneId.of("UTC"));

        // Save records across 3 days
        WellnessRecordDto dto = new WellnessRecordDto();
        dto.setWaterIntake(1000);

        wellnessRecordService.saveOrUpdateRecord(userPrimary, today.minusDays(2), dto);
        wellnessRecordService.saveOrUpdateRecord(userPrimary, today.minusDays(1), dto);
        wellnessRecordService.saveOrUpdateRecord(userPrimary, today, dto);

        // Fetch range
        List<WellnessRecord> range = wellnessRecordService.getRecordsRange(userPrimary, today.minusDays(2), today);
        assertEquals(3, range.size());
        assertEquals(today.minusDays(2), range.get(0).getRecordDate());
        assertEquals(today, range.get(2).getRecordDate());
    }

    @Test
    void testTimezoneCalculations() {
        // Change user timezone to Pacific/Auckland (+12:00 / +13:00)
        UserProfile profile = userProfileRepository.findByUserId(userPrimary.getId()).orElseThrow();
        profile.setTimezone("Pacific/Auckland");
        userProfileRepository.save(profile);

        ZoneId userZone = wellnessRecordService.getUserZoneId(userPrimary);
        assertEquals(ZoneId.of("Pacific/Auckland"), userZone);
        
        LocalDate aucklandToday = LocalDate.now(userZone);
        assertNotNull(aucklandToday);
    }
}
