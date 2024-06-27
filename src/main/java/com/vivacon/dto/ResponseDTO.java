package com.vivacon.dto;

import org.springframework.http.HttpStatus;

/**
 * This class is used to provide a skeleton for all later response DTO
 *
 * @param <T> a generic type stand for Data Type which need to be contained
 */
public class ResponseDTO<T> {

    private String status;

    private String message;

    private T data;

    public ResponseDTO(HttpStatus status, String message, T data) {
        this.status = status.toString();
        this.message = message;
        this.data = data;
    }

    public ResponseDTO(HttpStatus status, String message) {
        this.status = status.toString();
        this.message = message;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }
}
