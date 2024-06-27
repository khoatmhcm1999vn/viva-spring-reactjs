package com.vivacon.dto.response;

import com.vivacon.entity.enum_type.MessageStatus;
import com.vivacon.entity.enum_type.NotificationType;

import java.time.LocalDateTime;

public class NotificationResponse {

    private Long id;

    private Long presentationId;

    private String title;

    private String content;

    private String domainImage;

    private NotificationType type;

    private EssentialAccount actionAuthor;

    private LocalDateTime timestamp;

    private MessageStatus status;

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

    public void setPresentationId(Long presentationId) {
        this.presentationId = presentationId;
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

    public EssentialAccount getActionAuthor() {
        return actionAuthor;
    }

    public void setActionAuthor(EssentialAccount actionAuthor) {
        this.actionAuthor = actionAuthor;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getDomainImage() {
        return domainImage;
    }

    public void setDomainImage(String domainImage) {
        this.domainImage = domainImage;
    }

    public MessageStatus getStatus() {
        return status;
    }

    public void setStatus(MessageStatus status) {
        this.status = status;
    }
}
