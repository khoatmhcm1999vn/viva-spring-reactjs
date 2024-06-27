package com.vivacon.entity;

import com.vivacon.entity.enum_type.MessageStatus;
import com.vivacon.entity.enum_type.NotificationType;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;
import java.time.LocalDateTime;

import static com.vivacon.entity.enum_type.MessageStatus.SENT;

@Entity
@Table(name = "notification")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "notification_id_generator")
    @SequenceGenerator(name = "notification_id_generator", sequenceName = "notification_id_seq", allocationSize = 1)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "type")
    private NotificationType type;

    @Column(name = "presentation_id")
    private Long presentationId;

    @Column(name = "trace_id")
    private Long traceId;

    @ManyToOne(targetEntity = Account.class)
    @JoinColumn(name = "action_author_id")
    private Account actionAuthor;

    @ManyToOne(targetEntity = Account.class)
    @JoinColumn(name = "receiver_id")
    private Account receiver;

    private String title;

    private String content;

    private MessageStatus status;

    private LocalDateTime timestamp;

    public Notification() {
    }

    public Notification(String subject, String content, Account account) {
        this.title = subject;
        this.content = content;
        this.receiver = account;
        this.timestamp = LocalDateTime.now();
        this.status = SENT;
    }

    public Notification(NotificationType type, Account actionAuthor, Account receiver, Long presentationId,
                        Long traceId, String title, String content) {
        this.type = type;
        this.presentationId = presentationId;
        this.traceId = traceId;
        this.receiver = receiver;
        this.title = title;
        this.content = content;
        this.actionAuthor = actionAuthor;
        this.timestamp = LocalDateTime.now();
        this.status = SENT;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public NotificationType getType() {
        return type;
    }

    public void setType(NotificationType type) {
        this.type = type;
    }

    public Long getPresentationId() {
        return presentationId;
    }

    public void setPresentationId(Long domainId) {
        this.presentationId = domainId;
    }

    public Account getReceiver() {
        return receiver;
    }

    public void setReceiver(Account receiver) {
        this.receiver = receiver;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public Account getActionAuthor() {
        return actionAuthor;
    }

    public void setActionAuthor(Account actionAuthor) {
        this.actionAuthor = actionAuthor;
    }

    public MessageStatus getStatus() {
        return status;
    }

    public void setStatus(MessageStatus status) {
        this.status = status;
    }

    public Long getTraceId() {
        return traceId;
    }

    public void setTraceId(Long traceId) {
        this.traceId = traceId;
    }


    public static final class NotificationBuilder {
        private Notification notification;

        public NotificationBuilder() {
            notification = new Notification();
        }

        public NotificationBuilder type(NotificationType type) {
            notification.setType(type);
            return this;
        }

        public NotificationBuilder presentationId(Long presentationId) {
            notification.setPresentationId(presentationId);
            return this;
        }

        public NotificationBuilder traceId(Long traceId) {
            notification.setTraceId(traceId);
            return this;
        }

        public NotificationBuilder actionAuthor(Account actionAuthor) {
            notification.setActionAuthor(actionAuthor);
            return this;
        }

        public NotificationBuilder receiver(Account receiver) {
            notification.setReceiver(receiver);
            return this;
        }

        public NotificationBuilder title(String title) {
            notification.setTitle(title);
            return this;
        }

        public NotificationBuilder content(String content) {
            notification.setContent(content);
            return this;
        }

        public NotificationBuilder status(MessageStatus status) {
            notification.setStatus(status);
            return this;
        }

        public NotificationBuilder timestamp(LocalDateTime timestamp) {
            notification.setTimestamp(timestamp);
            return this;
        }

        public Notification build() {
            return notification;
        }
    }
}
