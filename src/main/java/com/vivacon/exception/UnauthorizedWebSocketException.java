package com.vivacon.exception;

import com.vivacon.common.constant.Constants;

public class UnauthorizedWebSocketException extends RuntimeException {

    public UnauthorizedWebSocketException() {
        super("The request to access this required resource is not permitted because unauthorized reason");
    }

    public UnauthorizedWebSocketException(String message) {
        super(message);
    }
}
