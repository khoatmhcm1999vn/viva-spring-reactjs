package com.vivacon.dto.request;

public class MessageRequest {

    private Long conversationId;

    public MessageRequest() {
    }

    public MessageRequest(Long conversationId) {
        this.conversationId = conversationId;
    }

    public Long getConversationId() {
        return conversationId;
    }

    public void setConversationId(Long conversationId) {
        this.conversationId = conversationId;
    }
}
