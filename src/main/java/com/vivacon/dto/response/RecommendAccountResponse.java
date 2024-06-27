package com.vivacon.dto.response;

import java.util.List;

public class RecommendAccountResponse extends OutlineAccount {

    private List<EssentialAccount> mutualFriends;

    public List<EssentialAccount> getMutualFriends() {
        return mutualFriends;
    }

    public void setMutualFriends(List<EssentialAccount> mutualFriends) {
        this.mutualFriends = mutualFriends;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        RecommendAccountResponse that = (RecommendAccountResponse) o;
        return this.getId().equals(that.getId());
    }

    @Override
    public int hashCode() {
        return this.getId().intValue();
    }
}
