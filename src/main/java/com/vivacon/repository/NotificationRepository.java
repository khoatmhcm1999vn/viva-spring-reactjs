package com.vivacon.repository;

import com.vivacon.entity.Notification;
import com.vivacon.entity.enum_type.MessageStatus;
import com.vivacon.entity.enum_type.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Optional<Notification> findByTypeAndPresentationId(NotificationType type, Long id);

    Page<Notification> findByReceiverId(Long receiverId, Pageable pageable);

    Page<Notification> findByReceiverIdAndStatus(Long receiverId, MessageStatus status, Pageable pageable);

    @Modifying
    @Query("update Notification n set n.status = :status where n.id = :id")
    int updateStatus(@Param("id") long id,
                     @Param("status") MessageStatus status);

    @Modifying
    @Query("delete from Notification n where n.type = :type and n.traceId = :trace_id")
    int deleteByTypeAndTraceId(@Param("type") NotificationType type,
                               @Param("trace_id") Long traceId);

    @Modifying
    @Query("update Notification n set n.status = :toStatus where n.receiver.id = :receiverId and n.status = :fromStatus")
    int updateAllFromStatusToStatus(Long receiverId, MessageStatus fromStatus, MessageStatus toStatus);
}
