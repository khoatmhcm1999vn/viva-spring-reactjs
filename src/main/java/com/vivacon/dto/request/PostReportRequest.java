package com.vivacon.dto.request;

import com.vivacon.common.enum_type.SentitiveType;

public class PostReportRequest {

    private String content;

    private SentitiveType sentitiveType;

    private Long postId;

    public PostReportRequest(String content, SentitiveType sentitiveType, Long postId) {
        this.content = content;
        this.sentitiveType = sentitiveType;
        this.postId = postId;
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

    public Long getPostId() {
        return postId;
    }

    public void setPostId(Long postId) {
        this.postId = postId;
    }
}
