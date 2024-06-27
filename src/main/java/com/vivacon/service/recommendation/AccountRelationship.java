package com.vivacon.service.recommendation;

public class AccountRelationship {

    public Long account;
    public MutualFriendPerAccount mutualFriendPerAccount;

    public AccountRelationship(Long account, MutualFriendPerAccount mutualFriendPerAccount) {
        this.account = account;
        this.mutualFriendPerAccount = mutualFriendPerAccount;
    }
}