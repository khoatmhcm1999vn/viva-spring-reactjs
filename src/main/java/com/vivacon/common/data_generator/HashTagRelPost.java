package com.vivacon.common.data_generator;

import java.util.Objects;

public class HashTagRelPost {

    private int postId;

    private int hashTagId;

    public HashTagRelPost(int postId, int hashTagId) {
        this.postId = postId;
        this.hashTagId = hashTagId;
    }

    public int getPostId() {
        return postId;
    }

    public void setPostId(int postId) {
        this.postId = postId;
    }

    public int getHashTagId() {
        return hashTagId;
    }

    public void setHashTagId(int hashTagId) {
        this.hashTagId = hashTagId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        HashTagRelPost that = (HashTagRelPost) o;
        return Objects.equals(postId, that.postId) && Objects.equals(hashTagId, that.hashTagId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(postId, hashTagId);
    }
}
