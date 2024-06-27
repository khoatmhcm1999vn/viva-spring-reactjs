package com.vivacon.event.handler;

import com.vivacon.entity.Account;
import com.vivacon.entity.Notification;
import com.vivacon.entity.enum_type.MessageStatus;
import com.vivacon.entity.enum_type.NotificationType;
import com.vivacon.entity.report.CommentReport;
import com.vivacon.event.CommentReportApprovingEvent;
import com.vivacon.event.notification_provider.NotificationProvider;
import com.vivacon.repository.NotificationRepository;
import com.vivacon.service.SettingService;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.LinkedList;
import java.util.List;

import static com.vivacon.entity.enum_type.SettingType.EMAIL_ON_REPORTING_RESULT;

@Component
public class CommentReportHandler {

    @Qualifier("emailSender")
    private NotificationProvider emailSender;

    @Qualifier("webSocketSender")
    private NotificationProvider websocketSender;

    private NotificationRepository notificationRepository;

    private SettingService settingService;

    public CommentReportHandler(NotificationProvider emailSender,
                                NotificationProvider websocketSender,
                                SettingService settingService,
                                NotificationRepository notificationRepository) {
        this.emailSender = emailSender;
        this.websocketSender = websocketSender;
        this.notificationRepository = notificationRepository;
        this.settingService = settingService;
    }

    @Async
    @EventListener
    public void handleCommentReportApproving(CommentReportApprovingEvent event) {
        CommentReport commentReport = event.getCommentReport();
        List<Notification> approvingNotifications = createCommentReportApprovingNotifications(commentReport);

        notificationRepository.saveAllAndFlush(approvingNotifications);
        approvingNotifications.stream().forEach(notification -> {

            websocketSender.sendNotification(notification);
            boolean isEmailOnReportResult = Boolean.parseBoolean(settingService.evaluateSetting(
                    commentReport.getCreatedBy().getId(), EMAIL_ON_REPORTING_RESULT).toString());
            if (isEmailOnReportResult) {
                emailSender.sendNotification(notification);
            }
        });
    }

    private List<Notification> createCommentReportApprovingNotifications(CommentReport commentReport) {
        Account reportAuthor = commentReport.getCreatedBy();
        Account commentAuthor = commentReport.getComment().getCreatedBy();
        List<Notification> notifications = new LinkedList<>();

        String title = "Vivacon - Your comment report has been approved";
        String content = "Your report on the comment of " + commentAuthor.getFullName() + " has been review and approved " +
                "\n Thanks for your support.";
        Notification notificationForActionAuthor = createNotification(title, content, commentReport,
                NotificationType.COMMENT_REPORT_APPROVING_ACTION_AUTHOR, reportAuthor, reportAuthor);
        notifications.add(notificationForActionAuthor);

        title = "Vivacon - Your comment has been banned";
        content = "We found that your comment of has been violate your community terms on " + commentReport.getSentitiveType() +
                "\n So we delete it and its related resources.";
        Notification notificationForReportedPerson = createNotification(title, content, commentReport,
                NotificationType.COMMENT_REPORT_APPROVING_DOMAIN_AUTHOR, reportAuthor, commentAuthor);
        notifications.add(notificationForReportedPerson);

        return notifications;
    }

    private Notification createNotification(String title, String content, CommentReport commentReport,
                                            NotificationType type, Account actionAuthor, Account receiver) {
        return new Notification.NotificationBuilder()
                .actionAuthor(actionAuthor)
                .receiver(receiver)
                .presentationId(commentReport.getComment().getId())
                .traceId(commentReport.getId())
                .type(type)
                .status(MessageStatus.SENT)
                .timestamp(LocalDateTime.now())
                .title(title)
                .content(content)
                .build();
    }

}
