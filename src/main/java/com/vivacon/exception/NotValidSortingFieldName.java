package com.vivacon.exception;

public class NotValidSortingFieldName extends RuntimeException {

    public NotValidSortingFieldName() {
        super("You have provide a not valid field name for sorting purpose");
    }

    public NotValidSortingFieldName(String errorMessage) {
        super(errorMessage);
    }
}
