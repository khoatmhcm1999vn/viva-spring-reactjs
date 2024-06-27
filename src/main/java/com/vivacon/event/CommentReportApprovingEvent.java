package com.vivacon.event;

import com.vivacon.entity.report.CommentReport;
import org.springframework.context.ApplicationEvent;

public class CommentReportApprovingEvent extends ApplicationEvent {

    private transient CommentReport commentReport;

    public CommentReportApprovingEvent(Object source, CommentReport commentReport) {
        super(source);
        this.commentReport = commentReport;
    }

    public CommentReport getCommentReport() {
        return commentReport;
    }
}
