package com.vivacon.event;

import com.vivacon.entity.Account;
import org.springframework.context.ApplicationEvent;

public class GeneratingVerificationTokenEvent extends ApplicationEvent {

    private transient Account account;

    public GeneratingVerificationTokenEvent(Object source, Account account) {
        super(source);
        this.account = account;
    }

    public Account getAccount() {
        return account;
    }
}
