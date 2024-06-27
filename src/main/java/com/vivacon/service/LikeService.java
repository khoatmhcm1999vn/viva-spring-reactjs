package com.vivacon.service;

import com.vivacon.dto.response.OutlineAccount;
import com.vivacon.dto.sorting_filtering.PageDTO;

import java.util.Optional;

public interface LikeService {

    boolean like(Long postId);

    boolean unlike(Long postId);

    PageDTO<OutlineAccount> getAll(Long postId, Optional<String> sort, Optional<String> order, Optional<Integer> pageSize, Optional<Integer> pageIndex);
}
