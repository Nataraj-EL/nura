package com.nura.repository;

import com.nura.model.UserOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserOtpRepository extends JpaRepository<UserOtp, UUID> {
    List<UserOtp> findByPhoneNumberAndConsumedAtIsNullAndExpiresAtAfter(String phoneNumber, LocalDateTime now);
    Optional<UserOtp> findTopByPhoneNumberOrderByCreatedAtDesc(String phoneNumber);

    List<UserOtp> findByEmailAndConsumedAtIsNullAndExpiresAtAfter(String email, LocalDateTime now);
    Optional<UserOtp> findTopByEmailOrderByCreatedAtDesc(String email);

    List<UserOtp> findByPhoneNumberAndCreatedAtAfter(String phoneNumber, LocalDateTime since);
    List<UserOtp> findByEmailAndCreatedAtAfter(String email, LocalDateTime since);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM UserOtp uo WHERE uo.phoneNumber = :phoneNumber")
    void deleteByPhoneNumber(@org.springframework.data.repository.query.Param("phoneNumber") String phoneNumber);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM UserOtp uo WHERE uo.email = :email")
    void deleteByEmail(@org.springframework.data.repository.query.Param("email") String email);
}
