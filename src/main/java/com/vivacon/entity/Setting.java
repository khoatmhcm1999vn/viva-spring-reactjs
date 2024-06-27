package com.vivacon.entity;

import com.vivacon.entity.enum_type.SettingType;

import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.SequenceGenerator;

@Entity
public class Setting {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "setting_id_generator")
    @SequenceGenerator(name = "setting_id_generator", sequenceName = "setting_id_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(targetEntity = Account.class)
    @JoinColumn(name = "account_id")
    private Account account;

    @Enumerated(EnumType.STRING)
    private SettingType type;

    private String value;

    public Setting() {
    }

    public Setting(Account account, SettingType type, String value) {
        this.account = account;
        this.type = type;
        this.value = value;
    }

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

    public SettingType getType() {
        return type;
    }

    public void setType(SettingType type) {
        this.type = type;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }
}
