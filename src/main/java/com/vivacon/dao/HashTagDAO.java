package com.vivacon.dao;

import com.vivacon.dto.response.HashTagQuantityInCertainTime;

import java.time.LocalDateTime;
import java.util.List;

public interface HashTagDAO {

    List<HashTagQuantityInCertainTime> getTopTrendingHashTagInCertainTime(LocalDateTime startDate, LocalDateTime endDate, Integer limit);

}
