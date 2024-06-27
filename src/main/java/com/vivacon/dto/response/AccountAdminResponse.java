package com.vivacon.dto.response;

import com.vivacon.dto.AttachmentDTO;

import java.util.List;

public class AccountAdminResponse {

    private Long id;

    private String email;

    private String username;

    private List<AttachmentDTO> attachments;

    public AccountAdminResponse() {

    }

    public AccountAdminResponse(Long id, String email, String username, List<AttachmentDTO> attachments) {
        this.id = id;
        this.email = email;
        this.username = username;
        this.attachments = attachments;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public List<AttachmentDTO> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<AttachmentDTO> attachments) {
        this.attachments = attachments;
    }
}
