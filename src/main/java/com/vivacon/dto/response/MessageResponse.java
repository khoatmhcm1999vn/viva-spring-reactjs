package com.vivacon.dto.response;

import com.vivacon.entity.enum_type.MessageStatus;
import com.vivacon.entity.enum_type.MessageType;

import java.time.LocalDateTime;

public class MessageResponse {

    private Long id;

    private EssentialAccount sender;

    private Long conversationId;

    private String content;

    private MessageType messageType;

    private LocalDateTime timestamp;

    private MessageStatus status;

    public MessageResponse() {
    }

    public MessageResponse(EssentialAccount sender, Long conversationId, String content, MessageType messageType, LocalDateTime timestamp, MessageStatus status) {
        this.sender = sender;
        this.conversationId = conversationId;
        this.content = content;
        this.messageType = messageType;
        this.timestamp = timestamp;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public EssentialAccount getSender() {
        return sender;
    }

    public void setSender(EssentialAccount sender) {
        this.sender = sender;
    }

    public Long getConversationId() {
        return conversationId;
    }

    public void setConversationId(Long conversationId) {
        this.conversationId = conversationId;
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

    public MessageStatus getStatus() {
        return status;
    }

    public void setStatus(MessageStatus status) {
        this.status = status;
    }

    public MessageType getMessageType() {
        return messageType;
    }

    public void setMessageType(MessageType messageType) {
        this.messageType = messageType;
    }
}
