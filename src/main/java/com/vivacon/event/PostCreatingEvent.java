package com.vivacon.event;

import com.vivacon.entity.Post;
import org.springframework.context.ApplicationEvent;

public class PostCreatingEvent extends ApplicationEvent {

    private transient Post post;

    public PostCreatingEvent(Object source, Post post) {
        super(source);
        this.post = post;
    }

    public Post getPost() {
        return post;
    }
}
