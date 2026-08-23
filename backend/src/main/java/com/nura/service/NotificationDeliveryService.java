package com.nura.service;

import com.nura.model.Notification;
import com.nura.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationDeliveryService {

    private final NotificationRepository notificationRepository;

    public NotificationDeliveryService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    /**
     * Finds PENDING notifications that are ready for delivery and delivers them.
     */
    @Transactional
    public void deliverPendingNotifications() {
        LocalDateTime now = LocalDateTime.now();
        List<Notification> deliverables = notificationRepository.findPendingDeliverableNotifications(now);

        for (Notification n : deliverables) {
            // For IN_APP channel, we confirm delivery immediately by marking it DELIVERED
            if ("IN_APP".equalsIgnoreCase(n.getDeliveryChannel())) {
                n.setDeliveryStatus("DELIVERED");
                notificationRepository.save(n);
            }
        }
    }
}
