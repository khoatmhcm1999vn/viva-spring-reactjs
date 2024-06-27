package com.vivacon.service.recommendation;

import java.util.List;

public class RecommendAccount {

    public long accountId;

    public int mutualFriendCount;

    public List<Long> mutualFriends;

    public RecommendAccount(long accountId, int mutualFriendCount, List<Long> mutualFriends) {
        this.accountId = accountId;
        this.mutualFriendCount = mutualFriendCount;
        this.mutualFriends = mutualFriends;
    }
}
