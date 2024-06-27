package com.vivacon.dto.request;

import com.vivacon.common.enum_type.SentitiveType;

public class CommentReportRequest {

    private String content;

    private SentitiveType sentitiveType;

    private Long commentId;

    public CommentReportRequest(String content, SentitiveType sentitiveType, Long commentId) {
        this.content = content;
        this.sentitiveType = sentitiveType;
        this.commentId = commentId;
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

    public Long getCommentId() {
        return commentId;
    }

    public void setCommentId(Long commentId) {
        this.commentId = commentId;
    }
}
