package com.nura.service;

import com.nura.dto.PeriodRecordDto;
import com.nura.model.PeriodRecord;
import com.nura.model.User;
import com.nura.model.UserProfile;
import com.nura.repository.PeriodRecordRepository;
import com.nura.repository.UserProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class PeriodRecordService {

    private final PeriodRecordRepository periodRecordRepository;
    private final UserProfileRepository userProfileRepository;

    public PeriodRecordService(PeriodRecordRepository periodRecordRepository,
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
     * Get all period records for the authenticated user sorted by start date ascending.
     */
    public List<PeriodRecord> getPeriods(User user) {
        return periodRecordRepository.findByUserIdOrderByStartDateAsc(user.getId());
    }

    /**
     * Get a specific period record by ID, verifying ownership.
     */
    public PeriodRecord getPeriodById(User user, UUID id) {
        PeriodRecord record = periodRecordRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Period record not found."));

        if (!record.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied. You do not own this period record.");
        }

        return record;
    }

    /**
     * Create a new period record with validation checks.
     */
    @Transactional
    public PeriodRecord createPeriod(User user, PeriodRecordDto dto) {
        ZoneId userZone = getUserZoneId(user);
        LocalDate today = LocalDate.now(userZone);

        // Validation: Dates in the future are invalid
        if (dto.getStartDate().isAfter(today)) {
            throw new IllegalArgumentException("Start date cannot be in the future.");
        }
        if (dto.getEndDate() != null && dto.getEndDate().isAfter(today)) {
            throw new IllegalArgumentException("End date cannot be in the future.");
        }

        // Validation: End date cannot precede start date
        if (dto.getEndDate() != null && dto.getEndDate().isBefore(dto.getStartDate())) {
            throw new IllegalArgumentException("End date cannot be before the start date.");
        }

        // Validation: Prevent multiple active ongoing periods
        if (dto.getEndDate() == null) {
            Optional<PeriodRecord> ongoingOpt = periodRecordRepository.findByUserIdAndEndDateIsNull(user.getId());
            if (ongoingOpt.isPresent()) {
                throw new IllegalArgumentException("An active ongoing period is already logged. Please close it before logging a new one.");
            }
        }

        // Validation: Overlap verification
        List<PeriodRecord> overlaps;
        if (dto.getEndDate() == null) {
            overlaps = periodRecordRepository.findOverlappingOngoing(user.getId(), dto.getStartDate());
        } else {
            overlaps = periodRecordRepository.findOverlappingClosed(user.getId(), dto.getStartDate(), dto.getEndDate());
        }
        
        if (!overlaps.isEmpty()) {
            throw new IllegalArgumentException("The proposed dates overlap with an existing period record.");
        }

        PeriodRecord record = new PeriodRecord(user, dto.getStartDate(), dto.getEndDate());
        return periodRecordRepository.save(record);
    }

    /**
     * Update an existing period record with validation checks.
     */
    @Transactional
    public PeriodRecord updatePeriod(User user, UUID id, PeriodRecordDto dto) {
        PeriodRecord record = getPeriodById(user, id);

        ZoneId userZone = getUserZoneId(user);
        LocalDate today = LocalDate.now(userZone);

        // Validation: Future dates are invalid
        if (dto.getStartDate().isAfter(today)) {
            throw new IllegalArgumentException("Start date cannot be in the future.");
        }
        if (dto.getEndDate() != null && dto.getEndDate().isAfter(today)) {
            throw new IllegalArgumentException("End date cannot be in the future.");
        }

        // Validation: End date cannot precede start date
        if (dto.getEndDate() != null && dto.getEndDate().isBefore(dto.getStartDate())) {
            throw new IllegalArgumentException("End date cannot be before the start date.");
        }

        // Validation: Prevent multiple active ongoing periods (excluding this one)
        if (dto.getEndDate() == null) {
            Optional<PeriodRecord> ongoingOpt = periodRecordRepository.findByUserIdAndEndDateIsNull(user.getId());
            if (ongoingOpt.isPresent() && !ongoingOpt.get().getId().equals(id)) {
                throw new IllegalArgumentException("Another active ongoing period is already logged. Please close it first.");
            }
        }

        // Validation: Overlap verification (excluding current record ID)
        List<PeriodRecord> overlaps;
        if (dto.getEndDate() == null) {
            overlaps = periodRecordRepository.findOverlappingOngoingForUpdate(user.getId(), id, dto.getStartDate());
        } else {
            overlaps = periodRecordRepository.findOverlappingClosedForUpdate(user.getId(), id, dto.getStartDate(), dto.getEndDate());
        }
        
        if (!overlaps.isEmpty()) {
            throw new IllegalArgumentException("The proposed dates overlap with an existing period record.");
        }

        record.setStartDate(dto.getStartDate());
        record.setEndDate(dto.getEndDate());
        return periodRecordRepository.save(record);
    }

    /**
     * Delete an existing period record.
     */
    @Transactional
    public void deletePeriod(User user, UUID id) {
        PeriodRecord record = getPeriodById(user, id);
        periodRecordRepository.delete(record);
    }
}
