package com.nura.controller;

import com.nura.dto.WellnessRecordDto;
import com.nura.model.User;
import com.nura.model.WellnessRecord;
import com.nura.service.WellnessRecordService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/wellness")
public class WellnessController {

    private final WellnessRecordService wellnessRecordService;

    public WellnessController(WellnessRecordService wellnessRecordService) {
        this.wellnessRecordService = wellnessRecordService;
    }

    private User getAuthenticatedUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    private Map<String, Object> mapRecordToResponse(WellnessRecord r) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", r.getId());
        map.put("recordDate", r.getRecordDate());
        map.put("waterIntake", r.getWaterIntake());
        map.put("mood", r.getMood());
        map.put("energyLevel", r.getEnergyLevel());
        map.put("sleepDurationMinutes", r.getSleepDurationMinutes());
        map.put("symptoms", r.getSymptoms());
        map.put("note", r.getNote());
        return map;
    }

    @GetMapping("/today")
    public ResponseEntity<Map<String, Object>> getTodayRecord() {
        User user = getAuthenticatedUser();
        ZoneId userZone = wellnessRecordService.getUserZoneId(user);
        LocalDate today = LocalDate.now(userZone);

        Optional<WellnessRecord> recordOpt = wellnessRecordService.getRecord(user, today);
        Map<String, Object> response = new HashMap<>();
        if (recordOpt.isPresent()) {
            response.put("exists", true);
            response.put("record", mapRecordToResponse(recordOpt.get()));
        } else {
            response.put("exists", false);
            response.put("recordDate", today);
        }
        return ResponseEntity.ok(response);
    }

    @PutMapping("/today")
    public ResponseEntity<Map<String, Object>> updateTodayRecord(@Valid @RequestBody WellnessRecordDto dto) {
        User user = getAuthenticatedUser();
        ZoneId userZone = wellnessRecordService.getUserZoneId(user);
        LocalDate today = LocalDate.now(userZone);

        WellnessRecord saved = wellnessRecordService.saveOrUpdateRecord(user, today, dto);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Wellness record updated successfully.");
        response.put("record", mapRecordToResponse(saved));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/today")
    public ResponseEntity<Map<String, String>> deleteTodayRecord() {
        User user = getAuthenticatedUser();
        ZoneId userZone = wellnessRecordService.getUserZoneId(user);
        LocalDate today = LocalDate.now(userZone);

        wellnessRecordService.deleteRecord(user, today);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Today's wellness record deleted successfully.");
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getRecordsRange(
            @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        User user = getAuthenticatedUser();
        ZoneId userZone = wellnessRecordService.getUserZoneId(user);
        LocalDate today = LocalDate.now(userZone);

        // Default: last 7 days including today
        LocalDate finalFrom = (from != null) ? from : today.minusDays(6);
        LocalDate finalTo = (to != null) ? to : today;

        List<WellnessRecord> list = wellnessRecordService.getRecordsRange(user, finalFrom, finalTo);
        List<Map<String, Object>> response = list.stream()
                .map(this::mapRecordToResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }
}
