package com.vivacon.controller;

import com.vivacon.common.constant.Constants;
import com.vivacon.dto.response.OutlineAccount;
import com.vivacon.dto.sorting_filtering.PageDTO;
import com.vivacon.service.LikeService;
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

@Api(value = "Like Controller")
@RestController
@RequestMapping(value = Constants.API_V1 + "/like")
public class LikeController {

    private LikeService likeService;

    public LikeController(LikeService likeService) {
        this.likeService = likeService;
    }

    @ApiOperation(value = "Like a post")
    @PostMapping(value = "/{id}")
    public ResponseEntity<Object> likeOnePost(@PathVariable(name = "id") Long postId) {
        this.likeService.like(postId);
        return ResponseEntity.ok(null);
    }

    @ApiOperation(value = "Unlike a post")
    @DeleteMapping(value = "/{id}")
    public ResponseEntity<Object> unlikeOnePost(@PathVariable(name = "id") Long postId) {
        this.likeService.unlike(postId);
        return ResponseEntity.ok(null);
    }

    @ApiOperation(value = "Get list like based on criteria")
    @GetMapping("/post/{postId}")
    public PageDTO<OutlineAccount> getAll(
            @PathVariable(value = "postId") Long postId,
            @RequestParam(value = "_order", required = false) Optional<String> order,
            @RequestParam(value = "_sort", required = false) Optional<String> sort,
            @RequestParam(value = "limit", required = false) Optional<Integer> pageSize,
            @RequestParam(value = "page", required = false) Optional<Integer> pageIndex) {
        return likeService.getAll(postId, sort, order, pageSize, pageIndex);
    }
}














