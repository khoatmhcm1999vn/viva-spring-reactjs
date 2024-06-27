package com.vivacon.event;

import com.vivacon.entity.Following;
import org.springframework.context.ApplicationEvent;

public class FollowingEvent extends ApplicationEvent {

    private Following following;

    public FollowingEvent(Object source, Following following) {
        super(source);
        this.following = following;
    }

    public Following getFollowing() {
        return following;
    }
}
