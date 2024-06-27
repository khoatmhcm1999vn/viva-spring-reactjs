package com.vivacon.dto.response;

import java.time.LocalDateTime;

public class UserGeoLocation {

    private long id;

    private long accountId;

    private String device;

    private String country;

    private double latitude;

    private double longitude;

    private LocalDateTime lastLoggedIn;

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public long getAccountId() {
        return accountId;
    }

    public void setAccountId(long accountId) {
        this.accountId = accountId;
    }

    public String getDevice() {
        return device;
    }

    public void setDevice(String device) {
        this.device = device;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    public LocalDateTime getLastLoggedIn() {
        return lastLoggedIn;
    }

    public void setLastLoggedIn(LocalDateTime lastLoggedIn) {
        this.lastLoggedIn = lastLoggedIn;
    }

    public UserGeoLocation() {
    }

    public UserGeoLocation(long id, long accountId, String device, String country, double latitude, double longitude) {
        this.id = id;
        this.accountId = accountId;
        this.device = device;
        this.country = country;
        this.latitude = latitude;
        this.longitude = longitude;
    }
}
