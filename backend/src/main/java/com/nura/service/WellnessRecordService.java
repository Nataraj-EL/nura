package com.nura.service;

import com.nura.dto.WellnessRecordDto;
import com.nura.model.User;
import com.nura.model.UserProfile;
import com.nura.model.WellnessRecord;
import com.nura.repository.UserProfileRepository;
import com.nura.repository.WellnessRecordRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class WellnessRecordService {

    private final WellnessRecordRepository wellnessRecordRepository;
    private final UserProfileRepository userProfileRepository;

    private static final List<String> ALLOWED_MOODS = Arrays.asList("HAPPY", "CALM", "TIRED", "STRESSED", "SAD");
    private static final List<String> ALLOWED_SYMPTOMS = Arrays.asList("CRAMPS", "HEADACHE", "BLOATING", "FATIGUE", "MOOD_SWINGS");

    public WellnessRecordService(WellnessRecordRepository wellnessRecordRepository,
                                 UserProfileRepository userProfileRepository) {
        this.wellnessRecordRepository = wellnessRecordRepository;
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
     * Retrieve a daily record for the user on a specific date.
     */
    public Optional<WellnessRecord> getRecord(User user, LocalDate date) {
        return wellnessRecordRepository.findByUserIdAndRecordDate(user.getId(), date);
    }

    /**
     * Retrieve records for a date range.
     */
    public List<WellnessRecord> getRecordsRange(User user, LocalDate from, LocalDate to) {
        if (from == null || to == null) {
            throw new IllegalArgumentException("From and To dates are required for range search.");
        }
        if (to.isBefore(from)) {
            throw new IllegalArgumentException("To date cannot be before From date.");
        }
        return wellnessRecordRepository.findByUserIdAndRecordDateBetweenOrderByRecordDateAsc(user.getId(), from, to);
    }

    /**
     * Delete today's daily record.
     */
    @Transactional
    public void deleteRecord(User user, LocalDate date) {
        Optional<WellnessRecord> recordOpt = getRecord(user, date);
        recordOpt.ifPresent(wellnessRecordRepository::delete);
    }

    /**
     * Update/Save daily record with partial updates and concurrent merge safety.
     */
    @Transactional
    public WellnessRecord saveOrUpdateRecord(User user, LocalDate date, WellnessRecordDto dto) {
        // 1. Validation of controlled values
        validateDto(dto);

        try {
            return performSaveOrUpdate(user, date, dto);
        } catch (DataIntegrityViolationException ex) {
            // Handle concurrent insertion: reload existing record, merge updates, and save
            return performSaveOrUpdate(user, date, dto);
        }
    }

    private WellnessRecord performSaveOrUpdate(User user, LocalDate date, WellnessRecordDto dto) {
        WellnessRecord record = wellnessRecordRepository.findByUserIdAndRecordDate(user.getId(), date)
                .orElseGet(() -> new WellnessRecord(user, date));

        // Apply partial updates: do not overwrite existing fields if DTO properties are null
        if (dto.getWaterIntake() != null) {
            record.setWaterIntake(dto.getWaterIntake());
        }
        if (dto.getMood() != null) {
            record.setMood(dto.getMood().toUpperCase());
        }
        if (dto.getEnergyLevel() != null) {
            record.setEnergyLevel(dto.getEnergyLevel());
        }
        if (dto.getSleepDurationMinutes() != null) {
            record.setSleepDurationMinutes(dto.getSleepDurationMinutes());
        }
        if (dto.getSymptoms() != null) {
            record.setSymptoms(dto.getSymptoms().stream()
                    .map(String::toUpperCase)
                    .collect(Collectors.toList()));
        }
        if (dto.getNote() != null) {
            record.setNote(dto.getNote());
        }

        return wellnessRecordRepository.saveAndFlush(record);
    }

    private void validateDto(WellnessRecordDto dto) {
        if (dto.getMood() != null) {
            String moodUpper = dto.getMood().toUpperCase();
            if (!ALLOWED_MOODS.contains(moodUpper)) {
                throw new IllegalArgumentException("Invalid mood value. Allowed values are: " + ALLOWED_MOODS);
            }
        }

        if (dto.getSymptoms() != null) {
            for (String symptom : dto.getSymptoms()) {
                String symptomUpper = symptom.toUpperCase();
                if (!ALLOWED_SYMPTOMS.contains(symptomUpper)) {
                    throw new IllegalArgumentException("Invalid symptom tag: " + symptom + ". Allowed values are: " + ALLOWED_SYMPTOMS);
                }
            }
        }
    }
}
