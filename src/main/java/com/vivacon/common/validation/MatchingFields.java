package com.vivacon.common.validation;

import javax.validation.Constraint;
import javax.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import static java.lang.annotation.ElementType.ANNOTATION_TYPE;
import static java.lang.annotation.ElementType.TYPE;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

@Target(TYPE)
@Retention(RUNTIME)
@Constraint(validatedBy = MatchingFieldsValidator.class)
@Documented
public @interface MatchingFields {

    String message() default "The fields must match";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    String firstField();

    String secondField();

    @Target({TYPE, ANNOTATION_TYPE})
    @Retention(RUNTIME)
    @Documented
    @interface List {
        MatchingFields[] value();
    }
}