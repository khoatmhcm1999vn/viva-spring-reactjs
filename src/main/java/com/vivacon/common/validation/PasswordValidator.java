package com.vivacon.common.validation;

import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class PasswordValidator implements ConstraintValidator<Password, String> {

    private String patternTemplate;

    @Override
    public void initialize(Password password) {
        patternTemplate = password.pattern();
    }

    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        Pattern pattern = Pattern.compile(patternTemplate);
        Matcher matcher = pattern.matcher(password);
        return matcher.matches();
    }
}
