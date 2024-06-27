package com.vivacon.exception;

import com.vivacon.common.constant.Constants;

public class NotValidImageExtensionException extends RuntimeException {

    public NotValidImageExtensionException() {
        super(Constants.NOT_VALID_IMAGE_EXTENSION);
    }

    public NotValidImageExtensionException(String message) {
        super(message);
    }
}
