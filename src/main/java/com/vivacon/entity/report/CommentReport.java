package com.vivacon.entity.report;

import com.vivacon.entity.Comment;

import javax.persistence.Entity;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;

@Entity(name = "CommentReport")
public class CommentReport extends ReportTemplate {

    @ManyToOne(targetEntity = Comment.class)
    @JoinColumn(name = "comment_id")
    private Comment comment;

    public Comment getComment() {
        return comment;
    }

    public void setComment(Comment comment) {
        this.comment = comment;
    }
}
