package com.vivacon.dto.response;

import com.vivacon.entity.enum_type.Privacy;

public class OutlinePost {

    private Long id;

    private String firstImage;

    private Boolean isMultipleImages;

    private Long likeCount;

    private Long commentCount;

    private Privacy privacy;

    public OutlinePost() {

    }

    public OutlinePost(Long id, String firstImage, Boolean isMultipleImages, Long likeCount, Long commentCount, Privacy privacy) {
        this.id = id;
        this.firstImage = firstImage;
        this.isMultipleImages = isMultipleImages;
        this.likeCount = likeCount;
        this.commentCount = commentCount;
        this.privacy = privacy;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFirstImage() {
        return firstImage;
    }

    public void setFirstImage(String firstImage) {
        this.firstImage = firstImage;
    }

    public Boolean getMultipleImages() {
        return isMultipleImages;
    }

    public void setMultipleImages(Boolean multipleImages) {
        isMultipleImages = multipleImages;
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

    public Privacy getPrivacy() {
        return privacy;
    }

    public void setPrivacy(Privacy privacy) {
        this.privacy = privacy;
    }
}
