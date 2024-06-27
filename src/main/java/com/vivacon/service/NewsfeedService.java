package com.vivacon.service;

import com.vivacon.dto.response.NewsfeedPost;
import com.vivacon.dto.sorting_filtering.PageDTO;

import java.util.List;
import java.util.Optional;

public interface NewsfeedService {
    PageDTO<NewsfeedPost> getNewsfeed(Optional<Integer> pageSize, Optional<Integer> pageIndex);

    List<NewsfeedPost> getTrendingNewsfeedPost(Optional<Integer> limit, Optional<Integer> pageIndex);
}
