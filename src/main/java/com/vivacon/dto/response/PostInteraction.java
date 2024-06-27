package com.vivacon.dto.response;

import com.vivacon.entity.enum_type.Privacy;

import java.math.BigInteger;
import java.time.LocalDateTime;

public class PostInteraction {

    private BigInteger postId;

    private String caption;

    private LocalDateTime createdAt;

    private String userName;

    private String fullName;

    private BigInteger totalComment;

    private BigInteger totalLike;

    private BigInteger totalInteraction;

    private Privacy privacy;

    public BigInteger getPostId() {
        return postId;
    }

    public void setPostId(BigInteger postId) {
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

    public BigInteger getTotalComment() {
        return totalComment;
    }

    public void setTotalComment(BigInteger totalComment) {
        this.totalComment = totalComment;
    }

    public BigInteger getTotalLike() {
        return totalLike;
    }

    public void setTotalLike(BigInteger totalLike) {
        this.totalLike = totalLike;
    }

    public BigInteger getTotalInteraction() {
        return totalInteraction;
    }

    public void setTotalInteraction(BigInteger totalInteraction) {
        this.totalInteraction = totalInteraction;
    }

    public Privacy getPrivacy() {
        return privacy;
    }

    public void setPrivacy(Privacy privacy) {
        this.privacy = privacy;
    }


    public static final class PostInteractionBuilder {
        private PostInteraction postInteraction;

        public PostInteractionBuilder() {
            postInteraction = new PostInteraction();
        }

        public PostInteractionBuilder postId(BigInteger postId) {
            postInteraction.setPostId(postId);
            return this;
        }

        public PostInteractionBuilder caption(String caption) {
            postInteraction.setCaption(caption);
            return this;
        }

        public PostInteractionBuilder createdAt(LocalDateTime createdAt) {
            postInteraction.setCreatedAt(createdAt);
            return this;
        }

        public PostInteractionBuilder userName(String userName) {
            postInteraction.setUserName(userName);
            return this;
        }

        public PostInteractionBuilder fullName(String fullName) {
            postInteraction.setFullName(fullName);
            return this;
        }

        public PostInteractionBuilder totalComment(BigInteger totalComment) {
            postInteraction.setTotalComment(totalComment);
            return this;
        }

        public PostInteractionBuilder totalLike(BigInteger totalLike) {
            postInteraction.setTotalLike(totalLike);
            return this;
        }

        public PostInteractionBuilder totalInteraction(BigInteger totalInteraction) {
            postInteraction.setTotalInteraction(totalInteraction);
            return this;
        }

        public PostInteractionBuilder privacy(Privacy privacy) {
            postInteraction.setPrivacy(privacy);
            return this;
        }

        public PostInteraction build() {
            return postInteraction;
        }
    }
}
