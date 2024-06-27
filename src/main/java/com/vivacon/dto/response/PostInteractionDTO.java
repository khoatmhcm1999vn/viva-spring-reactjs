package com.vivacon.dto.response;

import com.vivacon.dto.AttachmentDTO;

import java.time.LocalDateTime;
import java.util.List;

public class PostInteractionDTO {

    private Long postId;

    private String caption;

    private LocalDateTime createdAt;

    private String userName;

    private String fullName;

    private Long totalComment;

    private Long totalLike;

    private Long totalInteraction;

    private List<AttachmentDTO> lstAttachmentDTO;

    public PostInteractionDTO() {

    }

    public PostInteractionDTO(Long postId, String caption, LocalDateTime createdAt, String userName, String fullName, Long totalComment, Long totalLike, Long totalInteraction, List<AttachmentDTO> lstAttachmentDTO) {
        this.postId = postId;
        this.caption = caption;
        this.createdAt = createdAt;
        this.userName = userName;
        this.fullName = fullName;
        this.totalComment = totalComment;
        this.totalLike = totalLike;
        this.totalInteraction = totalInteraction;
        this.lstAttachmentDTO = lstAttachmentDTO;
    }

    public Long getPostId() {
        return postId;
    }

    public void setPostId(Long postId) {
        this.postId = postId;
    }

    public String getCaption() {
        return caption;
    }

    public void setCaption(String caption) {
        this.caption = caption;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public Long getTotalComment() {
        return totalComment;
    }

    public void setTotalComment(Long totalComment) {
        this.totalComment = totalComment;
    }

    public Long getTotalLike() {
        return totalLike;
    }

    public void setTotalLike(Long totalLike) {
        this.totalLike = totalLike;
    }

    public Long getTotalInteraction() {
        return totalInteraction;
    }

    public void setTotalInteraction(Long totalInteraction) {
        this.totalInteraction = totalInteraction;
    }

    public List<AttachmentDTO> getLstAttachmentDTO() {
        return lstAttachmentDTO;
    }

    public void setLstAttachmentDTO(List<AttachmentDTO> lstAttachmentDTO) {
        this.lstAttachmentDTO = lstAttachmentDTO;
    }
}
