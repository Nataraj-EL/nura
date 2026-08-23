package com.nura.repository;

import com.nura.model.PeriodRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PeriodRecordRepository extends JpaRepository<PeriodRecord, UUID> {

    List<PeriodRecord> findByUserIdOrderByStartDateAsc(UUID userId);

    Optional<PeriodRecord> findByUserIdAndEndDateIsNull(UUID userId);

    @Query("SELECT p FROM PeriodRecord p WHERE p.user.id = :userId AND " +
           "(p.endDate IS NULL OR p.endDate >= :startDate)")
    List<PeriodRecord> findOverlappingOngoing(@Param("userId") UUID userId, 
                                             @Param("startDate") LocalDate startDate);

    @Query("SELECT p FROM PeriodRecord p WHERE p.user.id = :userId AND " +
           "p.startDate <= :endDate AND " +
           "(p.endDate IS NULL OR p.endDate >= :startDate)")
    List<PeriodRecord> findOverlappingClosed(@Param("userId") UUID userId, 
                                            @Param("startDate") LocalDate startDate, 
                                            @Param("endDate") LocalDate endDate);

    @Query("SELECT p FROM PeriodRecord p WHERE p.user.id = :userId AND p.id <> :excludeId AND " +
           "(p.endDate IS NULL OR p.endDate >= :startDate)")
    List<PeriodRecord> findOverlappingOngoingForUpdate(@Param("userId") UUID userId, 
                                                      @Param("excludeId") UUID excludeId, 
                                                      @Param("startDate") LocalDate startDate);

    @Query("SELECT p FROM PeriodRecord p WHERE p.user.id = :userId AND p.id <> :excludeId AND " +
           "p.startDate <= :endDate AND " +
           "(p.endDate IS NULL OR p.endDate >= :startDate)")
    List<PeriodRecord> findOverlappingClosedForUpdate(@Param("userId") UUID userId, 
                                                     @Param("excludeId") UUID excludeId, 
                                                     @Param("startDate") LocalDate startDate, 
                                                     @Param("endDate") LocalDate endDate);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM PeriodRecord p WHERE p.user.id = :userId")
    void deleteByUserId(@Param("userId") UUID userId);
}
