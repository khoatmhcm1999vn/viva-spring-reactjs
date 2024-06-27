package com.vivacon.service.impl;

import com.vivacon.common.enum_type.TimePeriod;
import com.vivacon.common.enum_type.TimeSection;
import com.vivacon.dao.HashTagDAO;
import com.vivacon.dao.PostDAO;
import com.vivacon.dao.UserDAO;
import com.vivacon.dto.response.HashTagQuantityInCertainTime;
import com.vivacon.dto.response.NewsfeedPost;
import com.vivacon.dto.response.PostInteraction;
import com.vivacon.dto.response.PostInteractionDTO;
import com.vivacon.dto.response.PostNewest;
import com.vivacon.dto.response.PostsQuantityInCertainTime;
import com.vivacon.dto.response.StatisticDataQuantity;
import com.vivacon.dto.response.UserAccountMostFollower;
import com.vivacon.dto.response.UserGeoLocation;
import com.vivacon.mapper.PageMapper;
import com.vivacon.mapper.PostMapper;
import com.vivacon.repository.AccountRepository;
import com.vivacon.repository.HashTagRepository;
import com.vivacon.repository.PostRepository;
import com.vivacon.service.StatisticService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class StatisticServiceImpl implements StatisticService {

    private PostRepository postRepository;

    private AccountRepository accountRepository;

    private HashTagRepository hashTagRepository;

    private UserDAO userDAO;

    private PostDAO postDAO;

    private HashTagDAO hashTagDAO;

    private PostMapper postMapper;

    public StatisticServiceImpl(PostRepository postRepository,
                                AccountRepository accountRepository,
                                HashTagRepository hashTagRepository,
                                UserDAO userDAO,
                                PostDAO postDAO,
                                HashTagDAO hashTagDAO,
                                PostMapper postMapper) {
        this.postRepository = postRepository;
        this.accountRepository = accountRepository;
        this.hashTagRepository = hashTagRepository;
        this.userDAO = userDAO;
        this.postDAO = postDAO;
        this.hashTagDAO = hashTagDAO;
        this.postMapper = postMapper;
    }

    @Override
    public StatisticDataQuantity getStatisticData() {
        return new StatisticDataQuantity(postRepository.getAllPostCounting(), accountRepository.getAllAccountCounting(), hashTagRepository.getAllHashTagCounting());
    }

    @Override
    public List<UserAccountMostFollower> getTheTopAccountMostFollowerStatistic(Integer limit) {
        return this.userDAO.getTheTopAccountMostFollowerStatistic(limit);
    }

    @Override
    public List<PostsQuantityInCertainTime> getThePostQuantityStatisticInTimePeriods(TimePeriod timePeriodOption) {
        return this.postDAO.getThePostQuantityStatisticInTimePeriods(timePeriodOption);
    }

    @Override
    public List<PostsQuantityInCertainTime> getTheUserQuantityStatisticInTimePeriods(TimePeriod timePeriodOption) {
        return this.userDAO.getTheUserQuantityStatisticInTimePeriods(timePeriodOption);
    }

    @Override
    public List<PostInteractionDTO> getTheTopPostInteraction(Integer limit, Integer pageIndex) {
        List<PostInteraction> topPostInteractions = postDAO.getTheTopPostInteraction(limit, pageIndex);
        return PageMapper.toDTOs(topPostInteractions, post -> this.postMapper.toPostInteraction(post));
    }

    @Override
    public List<NewsfeedPost> getTheTopTrendingPost(Integer limit, Integer pageIndex) {
        List<PostInteraction> postInteractions = postDAO.getTheTopPostInteraction(limit, pageIndex);
        return PageMapper.toDTOs(postInteractions, post -> this.postMapper.toNewsfeedPost(post));
    }

    @Override
    public List<PostNewest> getTopNewestPost(Integer limit) {
        return this.postDAO.getTopNewestPost(limit);
    }

    @Override
    public List<HashTagQuantityInCertainTime> getTopTrendingHashTagInCertainTime(Optional<TimeSection> timeSection, Optional<LocalDateTime> startDate, Optional<LocalDateTime> endDate, Integer limit) {

        if (timeSection.isPresent()) {
            List<LocalDateTime> localDateTimes = getStartDateAndEndDate(timeSection.get());
            LocalDateTime startDateTime = localDateTimes.get(0);
            LocalDateTime endDateTime = localDateTimes.get(1);

            return hashTagDAO.getTopTrendingHashTagInCertainTime(startDateTime, endDateTime, limit);
        }
        return null;
    }

    private List<LocalDateTime> getStartDateAndEndDate(TimeSection timeSection) {

        List<LocalDateTime> localDateTimeList = new ArrayList<>();

        LocalDateTime startDate = null;
        LocalDateTime endDate = LocalDateTime.now();

        switch (timeSection) {
            case DAYS: {
                startDate = endDate.minus(1, ChronoUnit.DAYS);
                break;
            }
            case WEEKS: {
                startDate = endDate.minus(1, ChronoUnit.WEEKS);
                break;
            }
            case MONTHS: {
                startDate = endDate.minus(1, ChronoUnit.MONTHS);
                break;
            }
            case QUARTERS: {
                startDate = endDate.minus(3, ChronoUnit.MONTHS);
                break;
            }
            case YEARS: {
                startDate = endDate.minus(1, ChronoUnit.YEARS);
                break;
            }
            default: {
                startDate = endDate.minus(1, ChronoUnit.YEARS);
                break;
            }
        }

        localDateTimeList.add(startDate);
        localDateTimeList.add(endDate);

        return localDateTimeList;
    }

    @Override
    public List<UserGeoLocation> getLoginLocationPerAccount() {
        return userDAO.getLoginLocationPerAccount();
    }
}
