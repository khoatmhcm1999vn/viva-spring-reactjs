package com.vivacon.dto.request;

public class NewParticipantMessage extends MessageRequest{

    private String username;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }
}
