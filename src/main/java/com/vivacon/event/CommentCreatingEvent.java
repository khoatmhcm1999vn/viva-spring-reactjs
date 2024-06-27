package com.vivacon.event;

import com.vivacon.entity.Account;
import com.vivacon.entity.Comment;
import org.springframework.context.ApplicationEvent;

public class CommentCreatingEvent extends ApplicationEvent {

    private Comment comment;

    public CommentCreatingEvent(Object source, Comment comment) {
        super(source);
        this.comment = comment;
    }

    public Comment getComment() {
        return comment;
    }
}
