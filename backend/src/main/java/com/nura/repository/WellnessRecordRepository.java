package com.nura.repository;

import com.nura.model.WellnessRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WellnessRecordRepository extends JpaRepository<WellnessRecord, UUID> {

    Optional<WellnessRecord> findByUserIdAndRecordDate(UUID userId, LocalDate recordDate);

    List<WellnessRecord> findByUserIdAndRecordDateBetweenOrderByRecordDateAsc(
            UUID userId, 
            LocalDate fromDate, 
            LocalDate toDate
    );

    List<WellnessRecord> findByUserIdOrderByRecordDateAsc(UUID userId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM WellnessRecord w WHERE w.user.id = :userId")
    void deleteByUserId(@org.springframework.data.repository.query.Param("userId") UUID userId);
}
