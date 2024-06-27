package com.vivacon.dto.response;

import java.math.BigInteger;

public class PostsQuantityInCertainTime {

    private Integer time;

    private Integer year;

    private BigInteger quantity;

    public PostsQuantityInCertainTime(Integer time, Integer year, BigInteger quantity) {
        this.time = time;
        this.year = year;
        this.quantity = quantity;
    }

    public Integer getTime() {
        return time;
    }

    public void setTime(Integer time) {
        this.time = time;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public BigInteger getQuantity() {
        return quantity;
    }

    public void setQuantity(BigInteger quantity) {
        this.quantity = quantity;
    }
}