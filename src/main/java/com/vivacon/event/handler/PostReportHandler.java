package com.vivacon.event.handler;

import com.vivacon.entity.Account;
import com.vivacon.entity.Notification;
import com.vivacon.entity.enum_type.MessageStatus;
import com.vivacon.entity.enum_type.NotificationType;
import com.vivacon.entity.report.PostReport;
import com.vivacon.event.PostReportApprovingEvent;
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
public class PostReportHandler {

    @Qualifier("emailSender")
    private NotificationProvider emailSender;

    @Qualifier("webSocketSender")
    private NotificationProvider websocketSender;

    private NotificationRepository notificationRepository;

    private SettingService settingService;

    public PostReportHandler(NotificationProvider emailSender,
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
    public void handlePostReportApproving(PostReportApprovingEvent event) {
        PostReport postReport = event.getPostReport();
        List<Notification> approvingNotifications = createPostReportApprovingNotifications(postReport);

        notificationRepository.saveAllAndFlush(approvingNotifications);
        approvingNotifications.stream().forEach(notification -> {

            websocketSender.sendNotification(notification);
            boolean isEmailOnReportResult = Boolean.parseBoolean(settingService.evaluateSetting(
                    postReport.getCreatedBy().getId(), EMAIL_ON_REPORTING_RESULT).toString());
            if (isEmailOnReportResult) {
                emailSender.sendNotification(notification);
            }
        });
    }

    private List<Notification> createPostReportApprovingNotifications(PostReport postReport) {
        Account reportAuthor = postReport.getCreatedBy();
        Account postAuthor = postReport.getPost().getCreatedBy();
        List<Notification> notifications = new LinkedList<>();

        String title = "Vivacon - Your post report has been approved";
        String content = "Your report on the post of " + postAuthor.getFullName() + " has been review and approved " +
                "\n Thanks for your support.";
        Notification notificationForActionAuthor = createNotification(title, content, postReport,
                NotificationType.POST_REPORT_APPROVING_ACTION_AUTHOR, reportAuthor, reportAuthor);
        notifications.add(notificationForActionAuthor);

        title = "Vivacon - Your post has been banned";
        content = "We found that your post of has been violate your community terms on " + postReport.getSentitiveType() +
                "\n So we delete it and its related resources.";
        Notification notificationForReportedPerson = createNotification(title, content, postReport,
                NotificationType.POST_REPORT_APPROVING_DOMAIN_AUTHOR, reportAuthor, postAuthor);
        notifications.add(notificationForReportedPerson);

        return notifications;
    }

    private Notification createNotification(String title, String content, PostReport postReport,
                                            NotificationType type, Account actionAuthor, Account receiver) {
        return new Notification.NotificationBuilder()
                .actionAuthor(actionAuthor)
                .receiver(receiver)
                .presentationId(postReport.getPost().getId())
                .traceId(postReport.getId())
                .type(type)
                .status(MessageStatus.SENT)
                .timestamp(LocalDateTime.now())
                .title(title)
                .content(content)
                .build();
    }
}
