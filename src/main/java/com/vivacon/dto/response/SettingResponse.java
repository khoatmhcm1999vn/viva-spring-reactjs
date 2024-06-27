package com.vivacon.dto.response;

import com.vivacon.entity.Setting;
import com.vivacon.entity.enum_type.SettingType;

public class SettingResponse {

    private Long id;

    private Long accountId;

    private SettingType type;

    private String value;

    public SettingResponse(Long id, Long accountId, SettingType type, String value) {
        this.id = id;
        this.accountId = accountId;
        this.type = type;
        this.value = value;
    }

    public SettingResponse(Setting setting) {
        this.id = setting.getId();
        this.type = setting.getType();
        this.value = setting.getValue();
        this.accountId = setting.getAccount().getId();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getAccountId() {
        return accountId;
    }

    public void setAccountId(Long accountId) {
        this.accountId = accountId;
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
