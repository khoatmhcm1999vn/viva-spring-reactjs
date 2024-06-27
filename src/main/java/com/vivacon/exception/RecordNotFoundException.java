package com.vivacon.exception;

import com.vivacon.common.constant.Constants;

public class RecordNotFoundException extends RuntimeException {

    public RecordNotFoundException() {
        super(Constants.RECORD_NOT_FOUND);
    }

    public RecordNotFoundException(String message) {
        super(message);
    }
}
