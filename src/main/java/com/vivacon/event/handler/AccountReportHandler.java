package com.vivacon.event.handler;

import com.vivacon.entity.Account;
import com.vivacon.entity.Notification;
import com.vivacon.entity.enum_type.MessageStatus;
import com.vivacon.entity.enum_type.NotificationType;
import com.vivacon.entity.report.AccountReport;
import com.vivacon.event.AccountReportApprovingEvent;
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
public class AccountReportHandler {

    @Qualifier("emailSender")
    private NotificationProvider emailSender;

    @Qualifier("webSocketSender")
    private NotificationProvider websocketSender;

    private NotificationRepository notificationRepository;

    private SettingService settingService;

    public AccountReportHandler(NotificationProvider emailSender,
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
    public void handleAccountReportApproving(AccountReportApprovingEvent event) {
        AccountReport accountReport = event.getAccountReport();
        List<Notification> approvingNotifications = createAccountReportApprovingNotifications(accountReport);

        notificationRepository.saveAllAndFlush(approvingNotifications);
        approvingNotifications.stream().forEach(notification -> {

            websocketSender.sendNotification(notification);
            boolean isEmailOnReportResult = Boolean.parseBoolean(settingService.evaluateSetting(
                    accountReport.getCreatedBy().getId(), EMAIL_ON_REPORTING_RESULT).toString());
            if (isEmailOnReportResult) {
                emailSender.sendNotification(notification);
            }
        });
    }

    private List<Notification> createAccountReportApprovingNotifications(AccountReport accountReport) {
        Account reportAuthor = accountReport.getCreatedBy();
        Account accountAuthor = accountReport.getAccount();
        List<Notification> notifications = new LinkedList<>();

        String title = "Vivacon - Your account report has been approved";
        String content = "Your report on the account of " + accountAuthor.getFullName() + " has been review and approved " +
                "\n Thanks for your support.";
        Notification notificationForActionAuthor = createNotification(title, content, accountReport,
                NotificationType.ACCOUNT_REPORT_APPROVING_ACTION_AUTHOR, reportAuthor, reportAuthor);
        notifications.add(notificationForActionAuthor);

        title = "Vivacon - Your account has been banned";
        content = "We found that your account of has been violate your community terms on " + accountReport.getSentitiveType() +
                "\n So we delete it and its related resources.";
        Notification notificationForReportedPerson = createNotification(title, content, accountReport,
                NotificationType.ACCOUNT_REPORT_APPROVING_DOMAIN_AUTHOR, reportAuthor, accountAuthor);
        notifications.add(notificationForReportedPerson);

        return notifications;
    }

    private Notification createNotification(String title, String content, AccountReport accountReport,
                                            NotificationType type, Account actionAuthor, Account receiver) {
        return new Notification.NotificationBuilder()
                .actionAuthor(actionAuthor)
                .receiver(receiver)
                .presentationId(accountReport.getAccount().getId())
                .traceId(accountReport.getId())
                .type(type)
                .status(MessageStatus.SENT)
                .timestamp(LocalDateTime.now())
                .title(title)
                .content(content)
                .build();
    }

}
