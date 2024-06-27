package com.vivacon.dto;

import com.vivacon.entity.enum_type.SettingType;

public class ChangeSettingRequest {

    private SettingType settingType;

    private String value;

    public SettingType getSettingType() {
        return settingType;
    }

    public void setSettingType(SettingType settingType) {
        this.settingType = settingType;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }
}
