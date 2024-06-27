package com.vivacon.event.handler;

import com.vivacon.entity.Account;
import com.vivacon.entity.Comment;
import com.vivacon.entity.Notification;
import com.vivacon.entity.Post;
import com.vivacon.entity.enum_type.NotificationType;
import com.vivacon.event.CommentCreatingEvent;
import com.vivacon.event.notification_provider.NotificationProvider;
import com.vivacon.exception.RecordNotFoundException;
import com.vivacon.repository.AccountRepository;
import com.vivacon.repository.CommentRepository;
import com.vivacon.repository.NotificationRepository;
import com.vivacon.service.SettingService;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;
import java.util.stream.Collectors;

import static com.vivacon.entity.enum_type.NotificationType.AWARE_ON_COMMENT;
import static com.vivacon.entity.enum_type.NotificationType.COMMENT_ON_POST;
import static com.vivacon.entity.enum_type.NotificationType.REPLY_ON_COMMENT;
import static com.vivacon.entity.enum_type.SettingType.PUSH_NOTIFICATION_ON_COMMENT;

@Component
public class CommentCreatingEventHandler {

    @Qualifier("emailSender")
    private NotificationProvider emailSender;

    @Qualifier("webSocketSender")
    private NotificationProvider websocketSender;

    private SettingService settingService;

    private NotificationRepository notificationRepository;

    private CommentRepository commentRepository;

    private AccountRepository accountRepository;

    public CommentCreatingEventHandler(NotificationProvider emailSender,
                                       NotificationProvider websocketSender,
                                       SettingService settingService,
                                       NotificationRepository notificationRepository,
                                       CommentRepository commentRepository,
                                       AccountRepository accountRepository) {
        this.emailSender = emailSender;
        this.websocketSender = websocketSender;
        this.settingService = settingService;
        this.notificationRepository = notificationRepository;
        this.commentRepository = commentRepository;
        this.accountRepository = accountRepository;
    }

    @Async
    @EventListener
    public void onApplicationEvent(CommentCreatingEvent commentCreatingEvent) {
        Comment comment = commentCreatingEvent.getComment();
        boolean isAuthorCommentOnHisPost = comment.getPost().getCreatedBy().getId()
                .equals(comment.getCreatedBy().getId());

        List<Notification> notifications = new ArrayList<>();

        if (!isAuthorCommentOnHisPost) {
            notifications.add(createCommentNotification(comment, COMMENT_ON_POST, comment.getPost().getCreatedBy()));

            if (comment.getParentComment() != null) {
                notifications.add(createCommentNotification(comment, REPLY_ON_COMMENT, comment.getParentComment().getCreatedBy()));
                List<Notification> awareOnChildCommentNotifications = createAwareOnCommentNotifications(comment, () ->
                        commentRepository.findAllChildCommentsByParentCommentId(comment.getParentComment().getId(), true));
                notifications.addAll(awareOnChildCommentNotifications);
            } else {
                notifications.addAll(createAwareOnCommentNotifications(comment, () ->
                        commentRepository.findAllFirstLevelComments(comment.getPost().getId(), true)));
            }
        }
        sendCommentNotificationsBasedOnPriority(notifications);
    }

    /**
     * <h1>
     * Send the comment notifications based on the priority which can determine by Notification Type ordinal.
     * </h1>
     *
     * <p>
     * The expected case is when one comment creating event causes one receiver to have two or three comment notifications
     * which has been created based on the context of the current post, current first level comment, current child comment.
     * We need to find out which is the most suitable, unique and which must having the highest priority notification to
     * save to database and send via Notification Providers.
     * </p>
     *
     * @param notifications
     */
    private void sendCommentNotificationsBasedOnPriority(List<Notification> notifications) {

        Map<String, List<Notification>> collect = notifications.stream()
                .collect(Collectors.groupingBy(notification -> notification.getReceiver().getUsername()));

        for (String username : collect.keySet()) {

            Long authorPostId = accountRepository.findByUsernameIgnoreCase(username)
                    .orElseThrow(RecordNotFoundException::new).getId();
            Boolean isActiveSending = (Boolean) settingService.evaluateSetting(authorPostId, PUSH_NOTIFICATION_ON_COMMENT);
            if (isActiveSending) {
                List<Notification> notificationsByUsername = collect.get(username);
                if (notificationsByUsername.size() > 1) {

                    Comparator<Notification> reverseComparator = (t1, t2) -> {
                        int firstItemPriority = t1.getType().ordinal();
                        int secondItemPriority = t2.getType().ordinal();
                        if (firstItemPriority == secondItemPriority) {
                            return 0;
                        } else {
                            return firstItemPriority < secondItemPriority ? -1 : 1;
                        }
                    };
                    Collections.sort(notificationsByUsername, reverseComparator);

                }
                Notification highPriorityNotification = notificationsByUsername.get(0);
                Notification savedNotification = notificationRepository.saveAndFlush(highPriorityNotification);
                websocketSender.sendNotification(savedNotification);
            }
        }
    }

    /**
     * Send notification for all accounts who aware on the new comment
     *
     * @param comment
     */
    private List<Notification> createAwareOnCommentNotifications(Comment comment, Supplier<List<Comment>> findCommentsOperation) {
        String commentAuthorUsername = comment.getCreatedBy().getUsername();

        return findCommentsOperation.get()
                .stream().map(childComment -> childComment.getCreatedBy().getUsername())
                .distinct()
                .filter(username -> !username.equals(commentAuthorUsername))
                .map(username -> accountRepository.findByUsernameIgnoreCase(username)
                        .orElseThrow(RecordNotFoundException::new))
                .map(awareAccount -> createCommentNotification(comment, AWARE_ON_COMMENT, awareAccount))
                .collect(Collectors.toList());
    }

    /**
     * Create comment notification based on the Notification Type
     *
     * @param comment
     * @param type
     * @param receiver
     * @return
     */
    private Notification createCommentNotification(Comment comment, NotificationType type, Account receiver) {

        Post post = comment.getPost();
        Account actionAuthor = comment.getCreatedBy();
        String commentAuthorFullName = comment.getCreatedBy().getFullName();
        boolean isFirstLevelComment = comment.getParentComment() == null;

        Notification notification = null;
        switch (type) {
            case COMMENT_ON_POST: {
                notification = createCommentOnPostNotification(comment, post, actionAuthor, commentAuthorFullName);
                break;
            }
            case REPLY_ON_COMMENT: {
                if (comment.getParentComment() != null) {
                    notification = createReplyOnCommentNotification(comment, post, actionAuthor, commentAuthorFullName);
                }
                break;
            }
            case AWARE_ON_COMMENT: {
                if (receiver != null) {
                    if (isFirstLevelComment) {
                        notification = createAwareOnPostContextNotification(comment, post, actionAuthor,
                                receiver, commentAuthorFullName);
                    } else {
                        notification = createAwareOnCommentContextNotification(comment, post, actionAuthor,
                                receiver, commentAuthorFullName);
                    }
                }
                break;
            }
            default: {
                throw new RuntimeException("Not suitable type for creating comment notification");
            }
        }
        return notification;
    }

    private Notification createCommentOnPostNotification(Comment comment, Post post, Account actionAuthor,
                                                         String commentAuthorFullName) {
        String content = commentAuthorFullName + " comment on your post";
        String title = "New comments on your post";
        Account receiver = comment.getPost().getCreatedBy();

        return new Notification(COMMENT_ON_POST, actionAuthor, receiver, post.getId(), comment.getId(), title, content);
    }

    private Notification createReplyOnCommentNotification(Comment comment, Post post, Account actionAuthor,
                                                          String commentAuthorFullName) {
        Account receiver = comment.getParentComment().getCreatedBy();
        String postAlias = " in " + (post.getCreatedBy().getFullName().equals(receiver.getFullName())
                ? " your post" : post.getCreatedBy().getFullName()) + " post";
        String content = commentAuthorFullName + " comment on your comment " + postAlias;
        String title = "New reply on your comment " + postAlias;

        return new Notification(REPLY_ON_COMMENT, actionAuthor, receiver, post.getId(), comment.getId(), title, content);
    }

    private Notification createAwareOnPostContextNotification(Comment comment, Post post, Account actionAuthor,
                                                              Account receiver, String commentAuthorFullName) {
        String postAlias = " in " + (post.getCreatedBy().getFullName().equals(receiver.getFullName())
                ? " your post" : post.getCreatedBy().getFullName()) + " post";
        String content = commentAuthorFullName + " comment " + postAlias;
        String title = "New comment on the post you are involved " + postAlias;

        return new Notification(AWARE_ON_COMMENT, actionAuthor, receiver, post.getId(), comment.getId(), title, content);
    }

    private Notification createAwareOnCommentContextNotification(Comment comment, Post post, Account actionAuthor,
                                                                 Account receiver, String commentAuthorFullName) {
        String postAlias = " in " + (post.getCreatedBy().getFullName().equals(receiver.getFullName())
                ? " your post" : post.getCreatedBy().getFullName()) + " post";
        String content = commentAuthorFullName + " comment on the comment you are involved " + postAlias;
        String title = "New reply comment on the comment you are involved " + postAlias;

        return new Notification(AWARE_ON_COMMENT, actionAuthor, receiver, post.getId(), comment.getId(), title, content);
    }
}


