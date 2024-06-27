package com.vivacon.dto.response;

public class TopHashTagResponse {

    private Long id;

    private String name;

    private Long count;

    public TopHashTagResponse(Long id, String name, Long count) {
        this.id = id;
        this.name = name;
        this.count = count;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getCount() {
        return count;
    }

    public void setCount(Long count) {
        this.count = count;
    }
}
