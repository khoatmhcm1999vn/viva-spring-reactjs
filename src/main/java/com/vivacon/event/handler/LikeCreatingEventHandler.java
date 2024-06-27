package com.vivacon.event.handler;

import com.vivacon.entity.Account;
import com.vivacon.entity.Notification;
import com.vivacon.entity.Post;
import com.vivacon.entity.enum_type.MessageStatus;
import com.vivacon.event.LikeCreatingEvent;
import com.vivacon.event.notification_provider.NotificationProvider;
import com.vivacon.repository.LikeRepository;
import com.vivacon.repository.NotificationRepository;
import com.vivacon.service.SettingService;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Optional;

import static com.vivacon.entity.enum_type.NotificationType.LIKE_ON_POST;
import static com.vivacon.entity.enum_type.SettingType.PUSH_NOTIFICATION_ON_LIKE;

@Component
public class LikeCreatingEventHandler {

    @Qualifier("emailSender")
    private NotificationProvider emailSender;

    @Qualifier("webSocketSender")
    private NotificationProvider websocketSender;

    private SettingService settingService;

    private NotificationRepository notificationRepository;

    private LikeRepository likeRepository;

    public LikeCreatingEventHandler(NotificationProvider emailSender,
                                    NotificationProvider websocketSender,
                                    SettingService settingService,
                                    NotificationRepository notificationRepository,
                                    LikeRepository likeRepository) {
        this.emailSender = emailSender;
        this.websocketSender = websocketSender;
        this.settingService = settingService;
        this.notificationRepository = notificationRepository;
        this.likeRepository = likeRepository;
    }

    @Async
    @EventListener
    public void onApplicationEvent(LikeCreatingEvent likeCreatingEvent) {
        Long authorPostId = likeCreatingEvent.getLike().getPost().getCreatedBy().getId();
        Boolean isActiveSending = (Boolean) settingService.evaluateSetting(authorPostId, PUSH_NOTIFICATION_ON_LIKE);

        if (isActiveSending) {
            Account likeAuthor = likeCreatingEvent.getLike().getAccount();
            Post post = likeCreatingEvent.getLike().getPost();

            if (likeAuthor.getId() != post.getCreatedBy().getId()) {
                Optional<Notification> existingNotification = notificationRepository
                        .findByTypeAndPresentationId(LIKE_ON_POST, post.getId());

                Notification notification;
                if (!existingNotification.isPresent()) {
                    notification = createLikeNotification(likeCreatingEvent.getLike().getId(), likeAuthor, post);
                } else {
                    notification = updateTheContent(existingNotification.get(), likeAuthor, post);
                }
                Notification savedNotification = notificationRepository.saveAndFlush(notification);
                websocketSender.sendNotification(savedNotification);
            }
        }
    }

    private Notification updateTheContent(Notification notification, Account likeAuthor, Post post) {
        Long likeCount = likeRepository.getCountingLike(post.getId()) - 1;
        String displayOtherLikeCount = (likeCount > 0) ? " and " + likeCount + " others " : "";
        String content = likeAuthor.getFullName() + displayOtherLikeCount + " like your post";
        notification.setContent(content);
        notification.setTimestamp(LocalDateTime.now());
        notification.setActionAuthor(likeAuthor);
        notification.setStatus(MessageStatus.SENT);
        return notification;
    }

    private Notification createLikeNotification(long likeId, Account likeAuthor, Post post) {
        Long likeCount = likeRepository.getCountingLike(post.getId()) - 1;
        String displayOtherLikeCount = (likeCount > 0) ? " and " + likeCount + " others " : "";
        String content = likeAuthor.getFullName() + displayOtherLikeCount + " like your post";
        return new Notification(LIKE_ON_POST, likeAuthor, post.getCreatedBy(), post.getId(), likeId,
                "New like on your post", content);
    }
}
