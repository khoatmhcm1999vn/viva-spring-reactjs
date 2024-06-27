package com.vivacon.dao;

import com.vivacon.common.enum_type.TimePeriod;
import com.vivacon.dto.response.PostInteraction;
import com.vivacon.dto.response.PostNewest;
import com.vivacon.dto.response.PostsQuantityInCertainTime;

import java.util.List;

public interface PostDAO {

    List<PostsQuantityInCertainTime> getThePostQuantityStatisticInTimePeriods(TimePeriod timePeriodOption);

    List<PostInteraction> getTheTopPostInteraction(int limit, int pageIndex);

    List<PostNewest> getTopNewestPost(int limit);

}
