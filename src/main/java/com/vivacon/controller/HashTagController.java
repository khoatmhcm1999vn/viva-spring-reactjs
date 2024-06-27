package com.vivacon.controller;

import com.vivacon.common.constant.Constants;
import com.vivacon.dto.response.OutlinePost;
import com.vivacon.dto.response.TopHashTagResponse;
import com.vivacon.dto.sorting_filtering.PageDTO;
import com.vivacon.service.HashTagService;
import io.swagger.annotations.ApiOperation;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.Optional;

@RestController
@RequestMapping(Constants.API_V1)
public class HashTagController {

    private HashTagService hashTagService;

    public HashTagController(HashTagService hashTagService) {
        this.hashTagService = hashTagService;
    }

    @ApiOperation(value = "Get top hashtag by post")
    @GetMapping("/hashtag/top")
    public PageDTO<TopHashTagResponse> findTopHashTag(@RequestParam(value = "limit", required = false) Optional<Integer> pageSize,
                                                      @RequestParam(value = "page", required = false) Optional<Integer> pageIndex) {
        return hashTagService.findTopHashTag(pageSize, pageIndex);
    }

    @ApiOperation(value = "Get specific post by hashtag")
    @GetMapping("/hashtag")
    public PageDTO<OutlinePost> getSpecificPostByHashTag(@Valid @RequestParam("name") String name,
                                                         @RequestParam(value = "limit", required = false) Optional<Integer> pageSize,
                                                         @RequestParam(value = "page", required = false) Optional<Integer> pageIndex) {
        return hashTagService.getSpecificPostByHashTag(name, Optional.empty(), Optional.empty(), pageSize, pageIndex);
    }

}
