package com.vivacon.event;

import com.vivacon.entity.Like;
import org.springframework.context.ApplicationEvent;

public class LikeCreatingEvent extends ApplicationEvent {

    private Like like;

    public LikeCreatingEvent(Object source, Like like) {
        super(source);
        this.like = like;
    }

    public Like getLike() {
        return like;
    }
}
