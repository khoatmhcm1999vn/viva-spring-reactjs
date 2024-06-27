package com.vivacon.dto.request;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

public class CommentRequest {

    @NotEmpty
    @Size(min = 1, max = 1200)
    private String content;
    
    private Long parentCommentId;

    @NotNull
    private Long postId;

    public CommentRequest() {

    }

    public CommentRequest(String content, Long parentCommentId, Long postId) {
        this.content = content;
        this.parentCommentId = parentCommentId;
        this.postId = postId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Long getParentCommentId() {
        return parentCommentId;
    }

    public void setParentCommentId(Long parentCommentId) {
        this.parentCommentId = parentCommentId;
    }

    public Long getPostId() {
        return postId;
    }

    public void setPostId(Long postId) {
        this.postId = postId;
    }
}
