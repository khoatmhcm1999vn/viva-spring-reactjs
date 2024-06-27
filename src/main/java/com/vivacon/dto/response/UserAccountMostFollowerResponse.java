package com.vivacon.dto.response;

import com.vivacon.dto.AttachmentDTO;

import java.math.BigInteger;
import java.util.List;

public class UserAccountMostFollowerResponse {

    private BigInteger id;

    private String userName;

    private List<AttachmentDTO> attachments;

    private BigInteger accountQuantity;

    public UserAccountMostFollowerResponse() {
    }

    public UserAccountMostFollowerResponse(BigInteger id, String userName, List<AttachmentDTO> attachments, BigInteger accountQuantity) {
        this.id = id;
        this.userName = userName;
        this.attachments = attachments;
        this.accountQuantity = accountQuantity;
    }

    public BigInteger getId() {
        return id;
    }

    public void setId(BigInteger id) {
        this.id = id;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public List<AttachmentDTO> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<AttachmentDTO> attachments) {
        this.attachments = attachments;
    }

    public BigInteger getAccountQuantity() {
        return accountQuantity;
    }

    public void setAccountQuantity(BigInteger accountQuantity) {
        this.accountQuantity = accountQuantity;
    }
}
