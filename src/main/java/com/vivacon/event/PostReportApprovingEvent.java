package com.vivacon.event;

import com.vivacon.entity.report.PostReport;
import org.springframework.context.ApplicationEvent;

public class PostReportApprovingEvent extends ApplicationEvent {

    private transient PostReport postReport;

    public PostReportApprovingEvent(Object source, PostReport postReport) {
        super(source);
        this.postReport = postReport;
    }

    public PostReport getPostReport() {
        return postReport;
    }
}
