package com.vivacon.dto.request;

import java.util.Set;

public class ConversationCreatingRequest {

    private Set<String> usernames;

    private String firstMessageContent;

    public Set<String> getUsernames() {
        return usernames;
    }

    public void setUsernames(Set<String> usernames) {
        this.usernames = usernames;
    }

    public String getFirstMessageContent() {
        return firstMessageContent;
    }

    public void setFirstMessageContent(String firstMessageContent) {
        this.firstMessageContent = firstMessageContent;
    }
}
