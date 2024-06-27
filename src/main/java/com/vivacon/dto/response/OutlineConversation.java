package com.vivacon.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public class OutlineConversation {

    private Long id;

    private String name;

    private MessageResponse latestMessage;
    private List<EssentialAccount> participants;

    protected LocalDateTime createdAt;

    protected LocalDateTime lastModifiedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public MessageResponse getLatestMessage() {
        return latestMessage;
    }

    public void setLatestMessage(MessageResponse latestMessage) {
        this.latestMessage = latestMessage;
    }

    public List<EssentialAccount> getParticipants() {
        return participants;
    }

    public void setParticipants(List<EssentialAccount> participants) {
        this.participants = participants;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getLastModifiedAt() {
        return lastModifiedAt;
    }

    public void setLastModifiedAt(LocalDateTime lastModifiedAt) {
        this.lastModifiedAt = lastModifiedAt;
    }
}
