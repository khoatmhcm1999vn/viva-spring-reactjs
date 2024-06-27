package com.vivacon.dto.response;

public class StatisticDataQuantity {

    private Long totalPostCount;

    private Long totalAccountCount;

    private Long totalHashTagCount;

    public StatisticDataQuantity(Long totalPostCount, Long totalAccountCount, Long totalHashTagCount) {
        this.totalPostCount = totalPostCount;
        this.totalAccountCount = totalAccountCount;
        this.totalHashTagCount = totalHashTagCount;
    }

    public Long getTotalPostCount() {
        return totalPostCount;
    }

    public void setTotalPostCount(Long totalPostCount) {
        this.totalPostCount = totalPostCount;
    }

    public Long getTotalAccountCount() {
        return totalAccountCount;
    }

    public void setTotalAccountCount(Long totalAccountCount) {
        this.totalAccountCount = totalAccountCount;
    }

    public Long getTotalHashTagCount() {
        return totalHashTagCount;
    }

    public void setTotalHashTagCount(Long totalHashTagCount) {
        this.totalHashTagCount = totalHashTagCount;
    }
}
