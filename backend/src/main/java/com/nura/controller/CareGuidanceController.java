package com.nura.controller;

import com.nura.service.CareGuidanceService;
import com.nura.service.CareGuidanceService.CareResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/care")
public class CareGuidanceController {

    private final CareGuidanceService careGuidanceService;

    public CareGuidanceController(CareGuidanceService careGuidanceService) {
        this.careGuidanceService = careGuidanceService;
    }

    @GetMapping("/guidance")
    public ResponseEntity<CareResponse> getGuidance() {
        return ResponseEntity.ok(careGuidanceService.getGuidance());
    }

    @GetMapping("/symptoms")
    public ResponseEntity<CareResponse> getSymptoms() {
        return ResponseEntity.ok(careGuidanceService.getSymptoms());
    }

    @GetMapping("/safety")
    public ResponseEntity<CareResponse> getSafety() {
        return ResponseEntity.ok(careGuidanceService.getSafety());
    }
}
