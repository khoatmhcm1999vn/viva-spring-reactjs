package com.vivacon.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.vivacon.dto.sorting_filtering.PageDTO;
import com.vivacon.dto.AttachmentDTO;
import com.vivacon.dto.AuditableResponse;
import com.vivacon.entity.enum_type.Privacy;

import java.util.List;

public class DetailPost extends AuditableResponse {

    private Long id;

    private String caption;

    private Privacy privacy;

    private List<AttachmentDTO> attachments;

    private PageDTO<CommentResponse> comments;

    @JsonProperty(value = "isLiked")
    private Boolean isLiked;

    private Long likeCount;

    private Long commentCount;

    public DetailPost() {

    }

    public DetailPost(Long id, String caption, Privacy privacy) {
        this.id = id;
        this.caption = caption;
        this.privacy = privacy;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCaption() {
        return caption;
    }

    public void setCaption(String caption) {
        this.caption = caption;
    }

    public Privacy getPrivacy() {
        return privacy;
    }

    public void setPrivacy(Privacy privacy) {
        this.privacy = privacy;
    }

    public List<AttachmentDTO> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<AttachmentDTO> attachments) {
        this.attachments = attachments;
    }

    public PageDTO<CommentResponse> getComments() {
        return comments;
    }

    public void setComments(PageDTO<CommentResponse> comments) {
        this.comments = comments;
    }

    public Boolean getLiked() {
        return isLiked;
    }

    public void setLiked(Boolean liked) {
        isLiked = liked;
    }

    public Long getLikeCount() {
        return likeCount;
    }

    public void setLikeCount(Long likeCount) {
        this.likeCount = likeCount;
    }

    public Long getCommentCount() {
        return commentCount;
    }

    public void setCommentCount(Long commentCount) {
        this.commentCount = commentCount;
    }
}
