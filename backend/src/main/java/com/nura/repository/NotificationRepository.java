package com.nura.repository;

import com.nura.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId " +
           "AND n.deliveryStatus IN :statuses " +
           "AND (n.expiresAt IS NULL OR n.expiresAt > :now) " +
           "ORDER BY n.createdAt DESC")
    List<Notification> findActiveNotifications(
            @Param("userId") UUID userId,
            @Param("statuses") List<String> statuses,
            @Param("now") LocalDateTime now
    );

    @Query("SELECT n FROM Notification n WHERE n.deliveryStatus = 'PENDING' " +
           "AND (n.nextDeliveryTime IS NULL OR n.nextDeliveryTime <= :now)")
    List<Notification> findPendingDeliverableNotifications(@Param("now") LocalDateTime now);

    Optional<Notification> findByUserIdAndCategoryAndRecordDate(UUID userId, String category, LocalDate recordDate);

    List<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM Notification n WHERE n.user.id = :userId")
    void deleteByUserId(@Param("userId") UUID userId);
}
