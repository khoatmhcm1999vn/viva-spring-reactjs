package com.vivacon.controller;

import com.vivacon.common.constant.Constants;
import com.vivacon.common.enum_type.TimePeriod;
import com.vivacon.common.enum_type.TimeSection;
import com.vivacon.dto.response.HashTagQuantityInCertainTime;
import com.vivacon.dto.response.PostInteractionDTO;
import com.vivacon.dto.response.PostNewest;
import com.vivacon.dto.response.PostsQuantityInCertainTime;
import com.vivacon.dto.response.StatisticDataQuantity;
import com.vivacon.dto.response.UserAccountMostFollower;
import com.vivacon.dto.response.UserGeoLocation;
import com.vivacon.service.StatisticService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Api(value = "Post Statistic Controller")
@RestController
@RequestMapping(value = Constants.API_V1 + "/statistic")
public class StatisticController {

    private StatisticService statisticService;

    public StatisticController(StatisticService statisticService) {
        this.statisticService = statisticService;
    }

    @ApiOperation(value = "Get the general statistic data")
    @GetMapping("/getStatisticData")
    public StatisticDataQuantity getStatisticData() {
        return this.statisticService.getStatisticData();
    }

    @ApiOperation(value = "Get top account most followers statistic")
    @GetMapping("/user/most/followers")
    public List<UserAccountMostFollower> getTheTopAccountMostFollowerStatistic(@RequestParam(value = "limit") Optional<Integer> limit) {
        return this.statisticService.getTheTopAccountMostFollowerStatistic(limit.orElse(5));
    }

    @ApiOperation(value = "Get post quantity statistic in recent months")
    @GetMapping("/post/in/months")
    public List<PostsQuantityInCertainTime> getPostQuantityStatisticInMonths() {
        return this.statisticService.getThePostQuantityStatisticInTimePeriods(TimePeriod.MONTH);
    }

    @ApiOperation(value = "Get post quantity statistic in recent quarters")
    @GetMapping("/post/in/quarters")
    public List<PostsQuantityInCertainTime> getPostQuantityStatisticInQuarters() {
        return this.statisticService.getThePostQuantityStatisticInTimePeriods(TimePeriod.QUARTER);
    }

    @ApiOperation(value = "Get post quantity statistic in recent years")
    @GetMapping("/post/in/years")
    public List<PostsQuantityInCertainTime> getPostQuantityStatisticInYears() {
        return this.statisticService.getThePostQuantityStatisticInTimePeriods(TimePeriod.YEAR);
    }

    @ApiOperation(value = "Get top posts interaction statistic")
    @GetMapping("/post/top/interaction")
    public List<PostInteractionDTO> getTheTopPostInteraction(@RequestParam(value = "limit") Optional<Integer> limit,
                                                             @RequestParam(value = "pageIndex") Optional<Integer> pageIndex) {
        return this.statisticService.getTheTopPostInteraction(limit.orElse(5), pageIndex.orElse(0));
    }

    @ApiOperation(value = "Get top posts newest statistic")
    @GetMapping("/post/top/newest")
    public List<PostNewest> getPostByNewestCreatedAt(@RequestParam(value = "limit") Optional<Integer> limit) {
        return this.statisticService.getTopNewestPost(limit.orElse(5));
    }

    @ApiOperation(value = "Get post quantity statistic in recent months")
    @GetMapping("/user/in/months")
    public List<PostsQuantityInCertainTime> getUserQuantityStatisticInMonths() {
        return this.statisticService.getTheUserQuantityStatisticInTimePeriods(TimePeriod.MONTH);
    }

    @ApiOperation(value = "Get post quantity statistic in recent quarters")
    @GetMapping("/user/in/quarters")
    public List<PostsQuantityInCertainTime> getUserQuantityStatisticInQuarters() {
        return this.statisticService.getTheUserQuantityStatisticInTimePeriods(TimePeriod.QUARTER);
    }

    @ApiOperation(value = "Get post quantity statistic in recent years")
    @GetMapping("/user/in/years")
    public List<PostsQuantityInCertainTime> getUserQuantityStatisticInYears() {
        return this.statisticService.getTheUserQuantityStatisticInTimePeriods(TimePeriod.YEAR);
    }
	@ApiOperation(value = "Get latest login location per account")
    @GetMapping("/user/location")
    public List<UserGeoLocation> getLoginLocationPerAccount() {
        return this.statisticService.getLoginLocationPerAccount();
    }

	@ApiOperation(value = "Get top trending hashtag by post statistic in time")
    @GetMapping("/hashtag/in/time")
    public List<HashTagQuantityInCertainTime> getTopTrendingHashTagInCertainTime(@RequestParam(value = "timeSection") Optional<TimeSection> timeSection,
                                                                                 @RequestParam(value = "startDate") Optional<LocalDateTime> startDate,
                                                                                 @RequestParam(value = "endDate") Optional<LocalDateTime> endDate,
                                                                                 @RequestParam(value = "limit") Optional<Integer> limit) {
        return this.statisticService.getTopTrendingHashTagInCertainTime(timeSection, startDate, endDate, limit.orElse(5));
    }
}
