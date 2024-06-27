package com.vivacon.controller;

import com.vivacon.common.constant.Constants;
import com.vivacon.dto.response.NewsfeedPost;
import com.vivacon.dto.sorting_filtering.PageDTO;
import com.vivacon.service.NewsfeedService;
import com.vivacon.service.StatisticService;
import io.swagger.annotations.ApiOperation;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping(Constants.API_V1)
public class NewsfeedController {

    private NewsfeedService newsfeedService;

    private StatisticService statisticService;

    public NewsfeedController(NewsfeedService newsfeedService,
                              StatisticService statisticService) {
        this.newsfeedService = newsfeedService;
        this.statisticService = statisticService;
    }

    @ApiOperation(value = "Get newsfeed of the current user")
    @GetMapping("/newsfeed")
    public PageDTO<NewsfeedPost> getNewsfeed(@RequestParam(value = "limit", required = false) Optional<Integer> pageSize,
                                             @RequestParam(value = "page", required = false) Optional<Integer> pageIndex) {
        return newsfeedService.getNewsfeed(pageSize, pageIndex);
    }

    @ApiOperation(value = "Get top trending post")
    @GetMapping("/trending")
    public PageDTO<NewsfeedPost> getTopTrendingPost(@RequestParam(value = "limit") Optional<Integer> limit,
                                                    @RequestParam(value = "pageIndex") Optional<Integer> pageIndex) {
        List<NewsfeedPost> newsfeedPost = newsfeedService.getTrendingNewsfeedPost(limit, pageIndex);
        PageDTO<NewsfeedPost> pageResponse = new PageDTO<>();
        pageResponse.setContent(newsfeedPost);
        pageResponse.setLast(false);
        return pageResponse;
    }
}
