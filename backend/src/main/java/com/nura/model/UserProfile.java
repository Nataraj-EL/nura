package com.nura.model;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "user_profiles")
public class UserProfile {

    @Id
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private Integer age;

    @Column(name = "typical_cycle_length")
    private Integer typicalCycleLength;

    @Column(name = "typical_period_duration")
    private Integer typicalPeriodDuration;

    @Column(length = 50)
    private String timezone;

    @Column(name = "onboarding_status", nullable = false, length = 30)
    private String onboardingStatus;

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
    }

    // Default constructor
    public UserProfile() {}

    public UserProfile(User user, String onboardingStatus) {
        this.user = user;
        this.onboardingStatus = onboardingStatus;
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

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public Integer getTypicalCycleLength() {
        return typicalCycleLength;
    }

    public void setTypicalCycleLength(Integer typicalCycleLength) {
        this.typicalCycleLength = typicalCycleLength;
    }

    public Integer getTypicalPeriodDuration() {
        return typicalPeriodDuration;
    }

    public void setTypicalPeriodDuration(Integer typicalPeriodDuration) {
        this.typicalPeriodDuration = typicalPeriodDuration;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public String getOnboardingStatus() {
        return onboardingStatus;
    }

    public void setOnboardingStatus(String onboardingStatus) {
        this.onboardingStatus = onboardingStatus;
    }
}
