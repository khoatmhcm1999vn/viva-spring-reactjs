package com.vivacon.exception;

public class RestrictAccessUserResourceException extends RuntimeException {

    public RestrictAccessUserResourceException() {
        super("The request aim to access to user resource but the principal role currently are ADMIN");
    }

    public RestrictAccessUserResourceException(String message) {
        super(message);
    }
}
