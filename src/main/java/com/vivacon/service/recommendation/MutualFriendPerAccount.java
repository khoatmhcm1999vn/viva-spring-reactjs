package com.vivacon.service.recommendation;

public class MutualFriendPerAccount {

    public Long user;
    public Long mutualFriend;

    public MutualFriendPerAccount(Long user, Long mutualFriend) {
        this.user = user;
        this.mutualFriend = mutualFriend;
    }

    public MutualFriendPerAccount() {
        this(-1L, -1L);
    }

    @Override
    public String toString() {
        return " toUser: "
                + Long.toString(user) + " mutualFriend: " + Long.toString(mutualFriend);
    }
}