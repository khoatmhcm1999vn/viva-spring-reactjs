package com.vivacon.service.impl;

import com.vivacon.dto.response.NewsfeedPost;
import com.vivacon.dto.sorting_filtering.PageDTO;
import com.vivacon.dto.sorting_filtering.PostFilter;
import com.vivacon.entity.Account;
import com.vivacon.entity.enum_type.Privacy;
import com.vivacon.mapper.PostMapper;
import com.vivacon.repository.FollowingRepository;
import com.vivacon.repository.PostRepository;
import com.vivacon.service.AccountService;
import com.vivacon.service.NewsfeedService;
import com.vivacon.service.PostService;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class NewsfeedServiceImpl implements NewsfeedService {

    private FollowingRepository followingRepository;

    private PostService postService;

    private AccountService accountService;

    private PostRepository postRepository;

    private PostMapper postMapper;

    private StatisticServiceImpl statisticService;

    public NewsfeedServiceImpl(FollowingRepository followingRepository,
                               PostService postService,
                               PostMapper postMapper,
                               PostRepository postRepository,
                               StatisticServiceImpl statisticService,
                               AccountService accountService) {
        this.postService = postService;
        this.followingRepository = followingRepository;
        this.accountService = accountService;
        this.postMapper = postMapper;
        this.statisticService = statisticService;
        this.postRepository = postRepository;
    }

    @Override
    public PageDTO<NewsfeedPost> getNewsfeed(Optional<Integer> pageSize, Optional<Integer> pageIndex) {
        Account currentAccount = accountService.getCurrentAccount();
        List<Account> followingAccounts = this.followingRepository.findFollowing(currentAccount.getId());
        if (followingAccounts.isEmpty()) {
            return PageDTO.getEmptyPageInstance();
        }
        List<Long> listAccountId = followingAccounts.stream().map(Account::getId).collect(Collectors.toList());
        PostFilter postFilter = new PostFilter(Optional.of(listAccountId),
                Optional.of(Arrays.asList(Privacy.PUBLIC, Privacy.FOLLOWER)), false, true);
        return postService.getAll(postFilter, Optional.empty(), Optional.of("DESC"),
                Optional.of("lastModifiedAt"), pageSize, pageIndex);
    }

    @Override
    public List<NewsfeedPost> getTrendingNewsfeedPost(Optional<Integer> limit, Optional<Integer> pageIndex) {
        return statisticService.getTheTopTrendingPost(limit.orElse(5), pageIndex.orElse(0));
    }
}
