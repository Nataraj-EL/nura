package com.nura.model;

import jakarta.persistence.*;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notification_preferences")
public class NotificationPreference {

    @Id
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "period_reminder_enabled", nullable = false)
    private boolean periodReminderEnabled = true;

    @Column(name = "period_started_enabled", nullable = false)
    private boolean periodStartedEnabled = true;

    @Column(name = "wellness_checkin_enabled", nullable = false)
    private boolean wellnessCheckinEnabled = true;

    @Column(name = "water_reminder_enabled", nullable = false)
    private boolean waterReminderEnabled = true;

    @Column(name = "insight_available_enabled", nullable = false)
    private boolean insightAvailableEnabled = true;

    @Column(name = "scheduled_time", nullable = false)
    private LocalTime scheduledTime = LocalTime.of(20, 0);

    @Column(name = "quiet_hours_start")
    private LocalTime quietHoursStart = LocalTime.of(22, 0);

    @Column(name = "quiet_hours_end")
    private LocalTime quietHoursEnd = LocalTime.of(7, 0);

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Default constructor
    public NotificationPreference() {}

    public NotificationPreference(User user) {
        this.user = user;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public boolean isPeriodReminderEnabled() {
        return periodReminderEnabled;
    }

    public void setPeriodReminderEnabled(boolean periodReminderEnabled) {
        this.periodReminderEnabled = periodReminderEnabled;
    }

    public boolean isPeriodStartedEnabled() {
        return periodStartedEnabled;
    }

    public void setPeriodStartedEnabled(boolean periodStartedEnabled) {
        this.periodStartedEnabled = periodStartedEnabled;
    }

    public boolean isWellnessCheckinEnabled() {
        return wellnessCheckinEnabled;
    }

    public void setWellnessCheckinEnabled(boolean wellnessCheckinEnabled) {
        this.wellnessCheckinEnabled = wellnessCheckinEnabled;
    }

    public boolean isWaterReminderEnabled() {
        return waterReminderEnabled;
    }

    public void setWaterReminderEnabled(boolean waterReminderEnabled) {
        this.waterReminderEnabled = waterReminderEnabled;
    }

    public boolean isInsightAvailableEnabled() {
        return insightAvailableEnabled;
    }

    public void setInsightAvailableEnabled(boolean insightAvailableEnabled) {
        this.insightAvailableEnabled = insightAvailableEnabled;
    }

    public LocalTime getScheduledTime() {
        return scheduledTime;
    }

    public void setScheduledTime(LocalTime scheduledTime) {
        this.scheduledTime = scheduledTime;
    }

    public LocalTime getQuietHoursStart() {
        return quietHoursStart;
    }

    public void setQuietHoursStart(LocalTime quietHoursStart) {
        this.quietHoursStart = quietHoursStart;
    }

    public LocalTime getQuietHoursEnd() {
        return quietHoursEnd;
    }

    public void setQuietHoursEnd(LocalTime quietHoursEnd) {
        this.quietHoursEnd = quietHoursEnd;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
