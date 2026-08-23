package com.nura.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_otps")
public class UserOtp {

    @Id
    private UUID id;

    @Column(name = "phone_number", length = 30)
    private String phoneNumber;

    @Column(name = "email")
    private String email;

    @Column(name = "hashed_otp", nullable = false, length = 100)
    private String hashedOtp;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "consumed_at")
    private LocalDateTime consumedAt;

    @Column(name = "attempt_count", nullable = false)
    private Integer attemptCount = 0;

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (attemptCount == null) {
            attemptCount = 0;
        }
    }

    // Default constructor
    public UserOtp() {}

    public UserOtp(String phoneNumber, String hashedOtp, LocalDateTime expiresAt) {
        this.phoneNumber = phoneNumber;
        this.hashedOtp = hashedOtp;
        this.createdAt = LocalDateTime.now();
        this.expiresAt = expiresAt;
        this.attemptCount = 0;
    }

    public UserOtp(String phoneNumber, String email, String hashedOtp, LocalDateTime expiresAt) {
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.hashedOtp = hashedOtp;
        this.createdAt = LocalDateTime.now();
        this.expiresAt = expiresAt;
        this.attemptCount = 0;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getHashedOtp() {
        return hashedOtp;
    }

    public void setHashedOtp(String hashedOtp) {
        this.hashedOtp = hashedOtp;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public LocalDateTime getConsumedAt() {
        return consumedAt;
    }

    public void setConsumedAt(LocalDateTime consumedAt) {
        this.consumedAt = consumedAt;
    }

    public Integer getAttemptCount() {
        return attemptCount;
    }

    public void setAttemptCount(Integer attemptCount) {
        this.attemptCount = attemptCount;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
