package com.vivacon.dto.request;

import com.vivacon.common.enum_type.SentitiveType;

public class AccountReportRequest {

    private String content;

    private SentitiveType sentitiveType;

    private Long accountId;

    public AccountReportRequest(String content, SentitiveType sentitiveType, Long accountId) {
        this.content = content;
        this.sentitiveType = sentitiveType;
        this.accountId = accountId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public SentitiveType getSentitiveType() {
        return sentitiveType;
    }

    public void setSentitiveType(SentitiveType sentitiveType) {
        this.sentitiveType = sentitiveType;
    }

    public Long getAccountId() {
        return accountId;
    }

    public void setAccountId(Long accountId) {
        this.accountId = accountId;
    }
}
