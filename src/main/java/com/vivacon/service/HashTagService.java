package com.vivacon.service;

import com.vivacon.dto.response.OutlinePost;
import com.vivacon.dto.response.TopHashTagResponse;
import com.vivacon.dto.sorting_filtering.PageDTO;

import java.util.Optional;

public interface HashTagService {

    PageDTO<TopHashTagResponse> findTopHashTag(Optional<Integer> pageSize, Optional<Integer> pageIndex);

    PageDTO<OutlinePost> getSpecificPostByHashTag(String name, Optional<String> sort, Optional<String> order, Optional<Integer> pageSize, Optional<Integer> pageIndex);
}
