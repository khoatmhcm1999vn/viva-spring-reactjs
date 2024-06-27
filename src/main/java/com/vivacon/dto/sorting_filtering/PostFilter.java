package com.vivacon.dto.sorting_filtering;

import com.vivacon.entity.enum_type.Privacy;

import java.util.List;
import java.util.Optional;

public class PostFilter {

    private Optional<List<Long>> author;

    private Optional<List<Privacy>> privacy;

    private boolean own;

    private boolean active;

    public PostFilter(Optional<List<Long>> author, Optional<List<Privacy>> privacy, Boolean isOwn, Boolean isActive) {
        this.author = author;
        this.active = isActive;
        this.privacy = privacy;
        this.own = isOwn;
    }

    public Optional<List<Long>> getAuthor() {
        return author;
    }

    public void setAuthor(Optional<List<Long>> author) {
        this.author = author;
    }

    public Optional<List<Privacy>> getPrivacy() {
        return privacy;
    }

    public void setPrivacy(Optional<List<Privacy>> privacy) {
        this.privacy = privacy;
    }

    public boolean isOwn() {
        return own;
    }

    public void setOwn(boolean own) {
        this.own = own;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
