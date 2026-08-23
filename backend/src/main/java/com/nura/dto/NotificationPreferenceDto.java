package com.nura.dto;

import jakarta.validation.constraints.Pattern;

public class NotificationPreferenceDto {

    private Boolean periodReminderEnabled;
    private Boolean periodStartedEnabled;
    private Boolean wellnessCheckinEnabled;
    private Boolean waterReminderEnabled;
    private Boolean insightAvailableEnabled;

    @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "Scheduled time must be in HH:mm format")
    private String scheduledTime;

    @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "Quiet hours start must be in HH:mm format")
    private String quietHoursStart;

    @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "Quiet hours end must be in HH:mm format")
    private String quietHoursEnd;

    // Getters and Setters
    public Boolean getPeriodReminderEnabled() {
        return periodReminderEnabled;
    }

    public void setPeriodReminderEnabled(Boolean periodReminderEnabled) {
        this.periodReminderEnabled = periodReminderEnabled;
    }

    public Boolean getPeriodStartedEnabled() {
        return periodStartedEnabled;
    }

    public void setPeriodStartedEnabled(Boolean periodStartedEnabled) {
        this.periodStartedEnabled = periodStartedEnabled;
    }

    public Boolean getWellnessCheckinEnabled() {
        return wellnessCheckinEnabled;
    }

    public void setWellnessCheckinEnabled(Boolean wellnessCheckinEnabled) {
        this.wellnessCheckinEnabled = wellnessCheckinEnabled;
    }

    public Boolean getWaterReminderEnabled() {
        return waterReminderEnabled;
    }

    public void setWaterReminderEnabled(Boolean waterReminderEnabled) {
        this.waterReminderEnabled = waterReminderEnabled;
    }

    public Boolean getInsightAvailableEnabled() {
        return insightAvailableEnabled;
    }

    public void setInsightAvailableEnabled(Boolean insightAvailableEnabled) {
        this.insightAvailableEnabled = insightAvailableEnabled;
    }

    public String getScheduledTime() {
        return scheduledTime;
    }

    public void setScheduledTime(String scheduledTime) {
        this.scheduledTime = scheduledTime;
    }

    public String getQuietHoursStart() {
        return quietHoursStart;
    }

    public void setQuietHoursStart(String quietHoursStart) {
        this.quietHoursStart = quietHoursStart;
    }

    public String getQuietHoursEnd() {
        return quietHoursEnd;
    }

    public void setQuietHoursEnd(String quietHoursEnd) {
        this.quietHoursEnd = quietHoursEnd;
    }
}
