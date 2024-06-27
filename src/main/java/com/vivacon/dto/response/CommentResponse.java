package com.vivacon.dto.response;

import com.vivacon.dto.AuditableResponse;

public class CommentResponse extends AuditableResponse {

    private Long id;

    private String content;

    private Long totalChildComments;

    public CommentResponse() {

    }

    public CommentResponse(Long id, String content, Long totalChildComments) {
        this.id = id;
        this.content = content;
        this.totalChildComments = totalChildComments;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Long getTotalChildComments() {
        return totalChildComments;
    }

    public void setTotalChildComments(Long totalChildComments) {
        this.totalChildComments = totalChildComments;
    }
}
