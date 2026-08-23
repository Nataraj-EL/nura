package com.nura.controller;

import com.nura.dto.NotificationPreferenceDto;
import com.nura.model.Notification;
import com.nura.model.NotificationPreference;
import com.nura.model.User;
import com.nura.service.NotificationService;
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
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    private User getAuthenticatedUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    private Map<String, Object> mapPreferenceToResponse(NotificationPreference p) {
        Map<String, Object> map = new HashMap<>();
        map.put("periodReminderEnabled", p.isPeriodReminderEnabled());
        map.put("periodStartedEnabled", p.isPeriodStartedEnabled());
        map.put("wellnessCheckinEnabled", p.isWellnessCheckinEnabled());
        map.put("waterReminderEnabled", p.isWaterReminderEnabled());
        map.put("insightAvailableEnabled", p.isInsightAvailableEnabled());
        map.put("scheduledTime", p.getScheduledTime().toString());
        map.put("quietHoursStart", p.getQuietHoursStart() != null ? p.getQuietHoursStart().toString() : null);
        map.put("quietHoursEnd", p.getQuietHoursEnd() != null ? p.getQuietHoursEnd().toString() : null);
        return map;
    }

    private Map<String, Object> mapNotificationToResponse(Notification n) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", n.getId());
        map.put("category", n.getCategory());
        map.put("title", n.getTitle());
        map.put("message", n.getMessage());
        map.put("deliveryStatus", n.getDeliveryStatus());
        map.put("deliveryChannel", n.getDeliveryChannel());
        map.put("nextDeliveryTime", n.getNextDeliveryTime());
        map.put("readAt", n.getReadAt());
        map.put("expiresAt", n.getExpiresAt());
        map.put("recordDate", n.getRecordDate());
        map.put("createdAt", n.getCreatedAt());
        return map;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getNotifications() {
        User user = getAuthenticatedUser();
        List<Notification> list = notificationService.getActiveNotifications(user);
        List<Map<String, Object>> response = list.stream()
                .map(this::mapNotificationToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, String>> markAsRead(@PathVariable("id") UUID id) {
        User user = getAuthenticatedUser();
        notificationService.markAsRead(user, id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Notification marked as read successfully.");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/preferences")
    public ResponseEntity<Map<String, Object>> getPreferences() {
        User user = getAuthenticatedUser();
        NotificationPreference pref = notificationService.getOrCreatePreference(user);
        return ResponseEntity.ok(mapPreferenceToResponse(pref));
    }

    @PutMapping("/preferences")
    public ResponseEntity<Map<String, Object>> updatePreferences(@Valid @RequestBody NotificationPreferenceDto dto) {
        User user = getAuthenticatedUser();
        NotificationPreference updated = notificationService.updatePreference(user, dto);
        return ResponseEntity.ok(mapPreferenceToResponse(updated));
    }
}
