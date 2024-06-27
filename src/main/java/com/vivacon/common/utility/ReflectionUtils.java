package com.vivacon.common.utility;

import java.lang.reflect.Field;
import java.util.Arrays;
import java.util.Locale;
import java.util.Optional;

public class ReflectionUtils {

    private ReflectionUtils() {
    }

    public static boolean checkValidField(String sortString, Class<?> classType) {
        Field[] superclassFields = classType.getSuperclass().getDeclaredFields();
        Field[] derivedFields = classType.getDeclaredFields();
        Field[] allFieldsArray = new Field[derivedFields.length + superclassFields.length];
        Arrays.setAll(allFieldsArray, i -> (i < superclassFields.length ? superclassFields[i] : derivedFields[i - superclassFields.length]));
        Optional<Field> requiredField = Arrays.stream(allFieldsArray)
                .filter(field -> field.getName().toLowerCase(Locale.ROOT).equals(sortString.toLowerCase(Locale.ROOT))).findFirst();
        return requiredField.isPresent();
    }
}
