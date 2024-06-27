package com.vivacon.common.validation;

import com.vivacon.repository.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;

import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class UsernameValidator implements ConstraintValidator<Username, String> {

    @Autowired
    private AccountRepository accountRepository;

    private String patternTemplate;

    @Override
    public void initialize(Username username) {
        patternTemplate = username.pattern();
    }

    @Override
    public boolean isValid(String username, ConstraintValidatorContext context) {
        boolean checkingResult = true;
        context.disableDefaultConstraintViolation();

        Pattern pattern = Pattern.compile(patternTemplate);
        Matcher matcher = pattern.matcher(username);
        if (!matcher.matches()) {
            checkingResult = false;
            context.buildConstraintViolationWithTemplate("Username " + username + "is not match the pattern!")
                    .addConstraintViolation();
        }
        if (!this.accountRepository.findByUsernameIgnoreCase(username).isEmpty()) {
            checkingResult = false;
            context.buildConstraintViolationWithTemplate("Username " + username + "already exists!")
                    .addConstraintViolation();
        }
        return checkingResult;
    }
}
