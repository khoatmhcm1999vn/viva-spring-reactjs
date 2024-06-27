package com.vivacon.dto.response;

import java.math.BigDecimal;

public class HashTagQuantityInCertainTime {

    private String name;

    private BigDecimal quantity;

    public HashTagQuantityInCertainTime() {

    }

    public HashTagQuantityInCertainTime(String name, BigDecimal quantity) {
        this.name = name;
        this.quantity = quantity;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }
}
