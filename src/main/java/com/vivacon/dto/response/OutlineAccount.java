package com.vivacon.dto.response;

public class OutlineAccount {

    private Long id;

    private String username;

    private String fullName;

    private String avatar;

    private Boolean isFollowing;

    public OutlineAccount() {

    }

    public OutlineAccount(Long id, String username, String fullName, String avatar, Boolean isFollowing) {
        this.id = id;
        this.username = username;
        this.fullName = fullName;
        this.avatar = avatar;
        this.isFollowing = isFollowing;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public Boolean getIsFollowing() {
        return isFollowing;
    }

    public void setIsFollowing(Boolean following) {
        isFollowing = following;
    }
}
