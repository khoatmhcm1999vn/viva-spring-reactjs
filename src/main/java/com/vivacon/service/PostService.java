package com.vivacon.service;

import com.vivacon.dto.request.PostRequest;
import com.vivacon.dto.response.DetailPost;
import com.vivacon.dto.response.NewsfeedPost;
import com.vivacon.dto.sorting_filtering.PageDTO;
import com.vivacon.dto.sorting_filtering.PostFilter;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.NonTransientDataAccessException;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

public interface PostService {

    NewsfeedPost createPost(PostRequest postRequest);

    PageDTO<NewsfeedPost> getAll(PostFilter postFilter, Optional<String> keyword, Optional<String> order, Optional<String> sort, Optional<Integer> pageSize, Optional<Integer> pageIndex);

    DetailPost getDetailPost(Long postId, Optional<String> order, Optional<String> sort, Optional<Integer> pageSize, Optional<Integer> pageIndex);

    @Transactional(propagation = Propagation.REQUIRED, rollbackFor = {DataIntegrityViolationException.class, NonTransientDataAccessException.class, SQLException.class, Exception.class})
    boolean deactivatePost(long id);

    @Transactional(propagation = Propagation.REQUIRED, rollbackFor = {DataIntegrityViolationException.class, NonTransientDataAccessException.class, SQLException.class, Exception.class})
    boolean deactivatePost(List<Long> ids);

    List<Long> getAllIdByAccountId(Long accountId);

    DetailPost getDetailPostAdminRole(long postId, Optional<String> order, Optional<String> sort, Optional<Integer> pageSize, Optional<Integer> pageIndex);
}
