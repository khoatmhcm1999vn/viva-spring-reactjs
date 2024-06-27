package com.vivacon.common.validation;

import com.vivacon.repository.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;

import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;

public class UniqueEmailValidator implements ConstraintValidator<UniqueEmail, String> {

    @Autowired
    private AccountRepository accountRepository;

    @Override
    public boolean isValid(String email, ConstraintValidatorContext context) {
        return this.accountRepository.findByEmail(email).isEmpty();
    }
}
