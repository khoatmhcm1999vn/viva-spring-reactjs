package com.vivacon.entity.enum_type;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

public enum SettingType {

    EMAIL_ON_REPORTING_RESULT(Boolean.class, String.valueOf(true)),

    EMAIL_ON_MISSED_ACTIVITIES(Boolean.class, String.valueOf(false)),

    PUSH_NOTIFICATION_ON_COMMENT(Boolean.class, String.valueOf(true)),

    PUSH_NOTIFICATION_ON_LIKE(Boolean.class, String.valueOf(true)),

    PUSH_NOTIFICATION_ON_FOLLOWING(Boolean.class, String.valueOf(true)),

    PRIVACY_ON_ACTIVE_STATUS(Boolean.class, String.valueOf(true)),

    PRIVACY_ON_NEW_DEVICE_LOCATION(Boolean.class, String.valueOf(false));

    Class valueType;

    String defaultValue;

    SettingType(Class valueType, String defaultValue) {
        this.valueType = valueType;
        this.defaultValue = defaultValue;
    }

    public Class getValueType() {
        return valueType;
    }

    public String getDefaultValue() {
        return defaultValue;
    }

    public Object deserialize(String currentValue) {
        try {
            return new ObjectMapper().readValue(currentValue, valueType);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

    public String serialize(Object value) {
        ObjectMapper objectMapper = new ObjectMapper();
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    public boolean isValidValue(String value) {
        if (valueType.isEnum()) {
            return isInEnum(value, valueType);
        }
        return true;
    }

    private <E extends Enum<E>> boolean isInEnum(String value, Class<E> enumClass) {
        for (E e : enumClass.getEnumConstants()) {
            if (e.name().equals(value)) {
                return true;
            }
        }
        return false;
    }
}
