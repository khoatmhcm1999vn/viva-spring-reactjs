package com.vivacon.dto.response;

import java.math.BigInteger;
import java.time.LocalDateTime;

public class PostNewest {

    private BigInteger id;

    private Boolean active;

    private LocalDateTime createdAt;

    private LocalDateTime lastModifiedAt;

    private String caption;

    private Integer privacy;

    private String userName;

    private String fullName;

    private String url;

    public PostNewest(BigInteger id, Boolean active, LocalDateTime createdAt, LocalDateTime lastModifiedAt, String caption, Integer privacy, String userName, String fullName, String url) {
        this.id = id;
        this.active = active;
        this.createdAt = createdAt;
        this.lastModifiedAt = lastModifiedAt;
        this.caption = caption;
        this.privacy = privacy;
        this.userName = userName;
        this.fullName = fullName;
        this.url = url;
    }

    public BigInteger getId() {
        return id;
    }

    public void setId(BigInteger id) {
        this.id = id;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getLastModifiedAt() {
        return lastModifiedAt;
    }

    public void setLastModifiedAt(LocalDateTime lastModifiedAt) {
        this.lastModifiedAt = lastModifiedAt;
    }

    public String getCaption() {
        return caption;
    }

    public void setCaption(String caption) {
        this.caption = caption;
    }

    public Integer getPrivacy() {
        return privacy;
    }

    public void setPrivacy(Integer privacy) {
        this.privacy = privacy;
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

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }
}
