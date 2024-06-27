package com.vivacon.service;

import com.vivacon.dto.request.CommentRequest;
import com.vivacon.dto.response.CommentResponse;
import com.vivacon.dto.sorting_filtering.PageDTO;

import java.util.Optional;

public interface CommentService {

    CommentResponse createComment(CommentRequest postRequest);

    boolean deactivateComment(Long commentId);

    PageDTO<CommentResponse> getAllFirstLevelComment(Optional<String> sort, Optional<String> order, Optional<Integer> pageSize, Optional<Integer> pageIndex, Long postId);

    PageDTO<CommentResponse> getAllChildComment(Optional<String> sort, Optional<String> order, Optional<Integer> pageSize, Optional<Integer> pageIndex, Long parentCommentId, Long postId);
}
