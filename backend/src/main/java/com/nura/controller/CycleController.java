package com.nura.controller;

import com.nura.dto.PeriodRecordDto;
import com.nura.model.PeriodRecord;
import com.nura.model.User;
import com.nura.service.CycleService;
import com.nura.service.PeriodRecordService;
import com.nura.service.CyclePhaseService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/cycle")
public class CycleController {

    private final PeriodRecordService periodRecordService;
    private final CycleService cycleService;
    private final CyclePhaseService cyclePhaseService;

    public CycleController(PeriodRecordService periodRecordService, 
                           CycleService cycleService,
                           CyclePhaseService cyclePhaseService) {
        this.periodRecordService = periodRecordService;
        this.cycleService = cycleService;
        this.cyclePhaseService = cyclePhaseService;
    }

    private User getAuthenticatedUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    private Map<String, Object> mapPeriodToResponse(PeriodRecord p) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", p.getId());
        map.put("startDate", p.getStartDate());
        map.put("endDate", p.getEndDate());
        return map;
    }

    @PostMapping("/periods")
    public ResponseEntity<Map<String, Object>> createPeriod(@Valid @RequestBody PeriodRecordDto dto) {
        User user = getAuthenticatedUser();
        PeriodRecord p = periodRecordService.createPeriod(user, dto);
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Period record created successfully.");
        response.put("record", mapPeriodToResponse(p));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/periods")
    public ResponseEntity<List<Map<String, Object>>> listPeriods() {
        User user = getAuthenticatedUser();
        List<PeriodRecord> list = periodRecordService.getPeriods(user);
        
        List<Map<String, Object>> response = list.stream()
                .map(this::mapPeriodToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/periods/{id}")
    public ResponseEntity<Map<String, Object>> getPeriod(@PathVariable("id") UUID id) {
        User user = getAuthenticatedUser();
        PeriodRecord p = periodRecordService.getPeriodById(user, id);
        return ResponseEntity.ok(mapPeriodToResponse(p));
    }

    @PutMapping("/periods/{id}")
    public ResponseEntity<Map<String, Object>> updatePeriod(@PathVariable("id") UUID id, 
                                                            @Valid @RequestBody PeriodRecordDto dto) {
        User user = getAuthenticatedUser();
        PeriodRecord p = periodRecordService.updatePeriod(user, id, dto);
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Period record updated successfully.");
        response.put("record", mapPeriodToResponse(p));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/periods/{id}")
    public ResponseEntity<Map<String, String>> deletePeriod(@PathVariable("id") UUID id) {
        User user = getAuthenticatedUser();
        periodRecordService.deletePeriod(user, id);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Period record deleted successfully.");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/current")
    public ResponseEntity<Map<String, Object>> getCurrentCycle() {
        User user = getAuthenticatedUser();
        Map<String, Object> state = cycleService.getCurrentCycleState(user);
        return ResponseEntity.ok(state);
    }

    @GetMapping("/phase")
    public ResponseEntity<Map<String, Object>> getCyclePhase() {
        User user = getAuthenticatedUser();
        Map<String, Object> phaseState = cyclePhaseService.calculateCyclePhase(user);
        return ResponseEntity.ok(phaseState);
    }
}
