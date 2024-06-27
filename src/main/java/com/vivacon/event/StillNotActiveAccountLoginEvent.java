package com.vivacon.event;

import com.vivacon.entity.Account;
import org.springframework.context.ApplicationEvent;

public class StillNotActiveAccountLoginEvent extends ApplicationEvent {

    private Account account;

    public StillNotActiveAccountLoginEvent(Object source, Account account) {
        super(source);
        this.account = account;
    }

    public Account getAccount() {
        return account;
    }
}
