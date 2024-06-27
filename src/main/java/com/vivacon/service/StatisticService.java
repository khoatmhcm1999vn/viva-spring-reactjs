package com.vivacon.service;

import com.vivacon.common.enum_type.TimePeriod;
import com.vivacon.common.enum_type.TimeSection;
import com.vivacon.dto.response.HashTagQuantityInCertainTime;
import com.vivacon.dto.response.NewsfeedPost;
import com.vivacon.dto.response.PostInteractionDTO;
import com.vivacon.dto.response.PostNewest;
import com.vivacon.dto.response.PostsQuantityInCertainTime;
import com.vivacon.dto.response.StatisticDataQuantity;
import com.vivacon.dto.response.UserAccountMostFollower;
import com.vivacon.dto.response.UserGeoLocation;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface StatisticService {

    StatisticDataQuantity getStatisticData();

    List<UserAccountMostFollower> getTheTopAccountMostFollowerStatistic(Integer limit);

    List<PostsQuantityInCertainTime> getThePostQuantityStatisticInTimePeriods(TimePeriod timePeriodOption);

    List<PostsQuantityInCertainTime> getTheUserQuantityStatisticInTimePeriods(TimePeriod timePeriodOption);

    List<PostInteractionDTO> getTheTopPostInteraction(Integer limit, Integer pageIndex);

    List<NewsfeedPost> getTheTopTrendingPost(Integer limit, Integer pageIndex);

    List<PostNewest> getTopNewestPost(Integer limit);

    List<HashTagQuantityInCertainTime> getTopTrendingHashTagInCertainTime(Optional<TimeSection> timeSection, Optional<LocalDateTime> startDate, Optional<LocalDateTime> endDate, Integer limit);

    List<UserGeoLocation> getLoginLocationPerAccount();
}
