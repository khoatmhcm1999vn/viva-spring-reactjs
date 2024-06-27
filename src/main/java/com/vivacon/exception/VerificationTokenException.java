package com.vivacon.exception;

public class VerificationTokenException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public VerificationTokenException() {
        super("Verification token is not valid");
    }

    public VerificationTokenException(String message) {
        super(message);
    }
}
