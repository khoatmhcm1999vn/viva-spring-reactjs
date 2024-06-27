package com.vivacon.entity;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "device_metadata")
public class DeviceMetadata {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "device_metadata_id_generator")
    @SequenceGenerator(name = "device_metadata_id_generator", sequenceName = "device_metadata_id_seq", allocationSize = 1)
    private Long id;

    private String device;

    private String country;

    private String city;

    private Double latitude;

    private Double longitude;

    @ManyToOne(targetEntity = Account.class)
    @JoinColumn(name = "account_id")
    private Account account;

    private LocalDateTime lastLoggedIn;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Account getAccount() {
        return account;
    }

    public void setAccount(Account account) {
        this.account = account;
    }

    public String getDevice() {
        return device;
    }

    public void setDevice(String deviceDetails) {
        this.device = deviceDetails;
    }

    public LocalDateTime getLastLoggedIn() {
        return lastLoggedIn;
    }

    public void setLastLoggedIn(LocalDateTime lastLoggedIn) {
        this.lastLoggedIn = lastLoggedIn;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }


    public static final class DeviceMetadataBuilder {
        private DeviceMetadata deviceMetadata;

        public DeviceMetadataBuilder() {
            deviceMetadata = new DeviceMetadata();
        }

        public DeviceMetadataBuilder id(Long id) {
            deviceMetadata.setId(id);
            return this;
        }

        public DeviceMetadataBuilder device(String device) {
            deviceMetadata.setDevice(device);
            return this;
        }

        public DeviceMetadataBuilder country(String country) {
            deviceMetadata.setCountry(country);
            return this;
        }

        public DeviceMetadataBuilder city(String city) {
            deviceMetadata.setCity(city);
            return this;
        }

        public DeviceMetadataBuilder latitude(Double latitude) {
            deviceMetadata.setLatitude(latitude);
            return this;
        }

        public DeviceMetadataBuilder longitude(Double longitude) {
            deviceMetadata.setLongitude(longitude);
            return this;
        }

        public DeviceMetadataBuilder account(Account account) {
            deviceMetadata.setAccount(account);
            return this;
        }

        public DeviceMetadataBuilder lastLoggedIn(LocalDateTime lastLoggedIn) {
            deviceMetadata.setLastLoggedIn(lastLoggedIn);
            return this;
        }

        public DeviceMetadata build() {
            return deviceMetadata;
        }
    }
}
