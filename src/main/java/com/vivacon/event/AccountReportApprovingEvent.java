package com.vivacon.event;

import com.vivacon.entity.report.AccountReport;
import org.springframework.context.ApplicationEvent;

public class AccountReportApprovingEvent extends ApplicationEvent {

    private transient AccountReport accountReport;

    public AccountReportApprovingEvent(Object source, AccountReport accountReport) {
        super(source);
        this.accountReport = accountReport;
    }

    public AccountReport getAccountReport() {
        return accountReport;
    }

}
