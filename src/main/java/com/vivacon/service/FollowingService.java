package com.vivacon.service;

import com.vivacon.dto.response.AccountResponse;
import com.vivacon.dto.sorting_filtering.PageDTO;

import java.util.Optional;

public interface FollowingService {

    boolean follow(Long toAccountId);

    boolean unfollow(Long toAccountId);

    PageDTO<AccountResponse> findFollower(Long fromAccount, Optional<String> sort, Optional<String> order, Optional<Integer> pageSize, Optional<Integer> pageIndex);

    PageDTO<AccountResponse> findFollowing(Long fromAccount, Optional<String> sort, Optional<String> order, Optional<Integer> pageSize, Optional<Integer> pageIndex);
}
