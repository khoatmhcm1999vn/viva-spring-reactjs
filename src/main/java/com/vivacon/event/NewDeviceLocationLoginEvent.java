package com.vivacon.event;

import com.maxmind.geoip2.model.CityResponse;
import com.vivacon.entity.Account;
import org.springframework.context.ApplicationEvent;

public class NewDeviceLocationLoginEvent extends ApplicationEvent {

    private Account account;

    private String device;

    private String ip;

    private CityResponse location;

    public NewDeviceLocationLoginEvent(Object source, Account account, String device, CityResponse location, String ip) {
        super(source);
        this.account = account;
        this.device = device;
        this.location = location;
        this.ip = ip;
    }

    public Account getAccount() {
        return account;
    }

    public String getDevice() {
        return device;
    }

    public String getIp() {
        return ip;
    }

    public CityResponse getLocation() {
        return location;
    }
}
