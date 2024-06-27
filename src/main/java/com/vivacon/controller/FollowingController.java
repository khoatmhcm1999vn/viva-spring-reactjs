package com.vivacon.controller;

import com.vivacon.common.constant.Constants;
import com.vivacon.dto.response.AccountResponse;
import com.vivacon.dto.sorting_filtering.PageDTO;
import com.vivacon.service.FollowingService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@Api(value = "Following Controller")
@RestController
@RequestMapping(value = Constants.API_V1)
public class FollowingController {

    private FollowingService followingService;

    public FollowingController(FollowingService followingService) {
        this.followingService = followingService;
    }

    @ApiOperation(value = "Follow an account")
    @PostMapping(value = "/following/{id}")
    public ResponseEntity<Object> followOneAccount(@PathVariable(name = "id") Long toAccountId) {
        this.followingService.follow(toAccountId);
        return ResponseEntity.ok(null);
    }

    @ApiOperation(value = "Unfollow an account")
    @DeleteMapping(value = "following/{id}")
    public ResponseEntity<Object> unfollowOneAccount(@PathVariable(name = "id") Long toAccountId) {
        this.followingService.unfollow(toAccountId);
        return ResponseEntity.ok(null);
    }

    @ApiOperation(value = "Get list following of an account")
    @GetMapping("/following/{account}")
    public PageDTO<AccountResponse> getAllFollowing(
            @PathVariable(value = "account") Long account,
            @RequestParam(value = "_order", required = false) Optional<String> order,
            @RequestParam(value = "_sort", required = false) Optional<String> sort,
            @RequestParam(value = "limit", required = false) Optional<Integer> pageSize,
            @RequestParam(value = "page", required = false) Optional<Integer> pageIndex) {
        return followingService.findFollowing(account, order, sort, pageSize, pageIndex);
    }

    @ApiOperation(value = "Get list follower of an account")
    @GetMapping("/follower/{account}")
    public PageDTO<AccountResponse> getAllFollower(
            @PathVariable(value = "account") Long account,
            @RequestParam(value = "_order", required = false) Optional<String> order,
            @RequestParam(value = "_sort", required = false) Optional<String> sort,
            @RequestParam(value = "limit", required = false) Optional<Integer> pageSize,
            @RequestParam(value = "page", required = false) Optional<Integer> pageIndex) {
        return followingService.findFollower(account, order, sort, pageSize, pageIndex);
    }
}
