package com.vivacon.exception;

public class InvalidPasswordException extends RuntimeException {

    public InvalidPasswordException() {
        super("The old password is invalid");
    }

    public InvalidPasswordException(String message) {
        super(message);
    }
}
