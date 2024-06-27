package com.vivacon.controller;

import com.vivacon.common.constant.Constants;
import com.vivacon.dto.request.CommentRequest;
import com.vivacon.dto.response.CommentResponse;
import com.vivacon.dto.sorting_filtering.PageDTO;
import com.vivacon.service.CommentService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.Optional;

@Api(value = "Comment Controller")
@RestController
@RequestMapping(value = Constants.API_V1)
public class CommentController {

    private CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    /**
     * This endpoint is used to provide creating comment feature
     *
     * @param commentRequest
     * @return CommentResponse
     */
    @ApiOperation(value = "Creating comment")
    @PostMapping(value = "/comment")
    public CommentResponse createComment(@Valid @RequestBody CommentRequest commentRequest) {
        return this.commentService.createComment(commentRequest);
    }

    @ApiOperation(value = "Deleting a comment")
    @DeleteMapping(value = "/comment/{id}")
    public ResponseEntity<Object> deleteComment(@PathVariable(name = "id") Long id) {
        this.commentService.deactivateComment(id);
        return ResponseEntity.ok(null);
    }

    @ApiOperation(value = "Get list comment based on criteria")
    @GetMapping(value = "/post/{postId}/first-level-comment")
    public PageDTO<CommentResponse> getAll(
            @RequestParam(value = "_order", required = false) Optional<String> order,
            @RequestParam(value = "_sort", required = false) Optional<String> sort,
            @RequestParam(value = "limit", required = false) Optional<Integer> pageSize,
            @RequestParam(value = "page", required = false) Optional<Integer> pageIndex,
            @PathVariable(name = "postId", value = "postId", required = true) Long postId) {
        return commentService.getAllFirstLevelComment(sort, order, pageSize, pageIndex, postId);
    }

    @ApiOperation(value = "Get list comment based on criteria")
    @GetMapping(value = "/post/{postId}/comment/{parentCommentId}/child-comment")
    public PageDTO<CommentResponse> getAllChildComment(
            @RequestParam(value = "_order", required = false) Optional<String> order,
            @RequestParam(value = "_sort", required = false) Optional<String> sort,
            @RequestParam(value = "limit", required = false) Optional<Integer> pageSize,
            @RequestParam(value = "page", required = false) Optional<Integer> pageIndex,
            @PathVariable(name = "parentCommentId", value = "parentCommentId", required = true) Long parentCommentId,
            @PathVariable(name = "postId", value = "postId", required = true) Long postId) {
        return commentService.getAllChildComment(sort, order, pageSize, pageIndex, parentCommentId, postId);
    }
}
