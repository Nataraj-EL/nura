package com.nura.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.util.List;

public class WellnessRecordDto {

    @Min(value = 0, message = "Water intake cannot be negative")
    @Max(value = 20000, message = "Water intake cannot exceed 20,000 ml")
    private Integer waterIntake;

    @Size(max = 50, message = "Mood string too long")
    private String mood;

    @Min(value = 1, message = "Energy level must be at least 1")
    @Max(value = 5, message = "Energy level must be at most 5")
    private Integer energyLevel;

    @Min(value = 0, message = "Sleep duration cannot be negative")
    @Max(value = 1440, message = "Sleep duration cannot exceed 1440 minutes")
    private Integer sleepDurationMinutes;

    private List<String> symptoms;

    @Size(max = 1000, message = "Note cannot exceed 1000 characters")
    private String note;

    // Getters and Setters
    public Integer getWaterIntake() {
        return waterIntake;
    }

    public void setWaterIntake(Integer waterIntake) {
        this.waterIntake = waterIntake;
    }

    public String getMood() {
        return mood;
    }

    public void setMood(String mood) {
        this.mood = mood;
    }

    public Integer getEnergyLevel() {
        return energyLevel;
    }

    public void setEnergyLevel(Integer energyLevel) {
        this.energyLevel = energyLevel;
    }

    public Integer getSleepDurationMinutes() {
        return sleepDurationMinutes;
    }

    public void setSleepDurationMinutes(Integer sleepDurationMinutes) {
        this.sleepDurationMinutes = sleepDurationMinutes;
    }

    public List<String> getSymptoms() {
        return symptoms;
    }

    public void setSymptoms(List<String> symptoms) {
        this.symptoms = symptoms;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
