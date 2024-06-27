package com.vivacon.controller;

import com.vivacon.common.constant.Constants;
import com.vivacon.dto.request.PostRequest;
import com.vivacon.dto.response.DetailPost;
import com.vivacon.dto.response.NewsfeedPost;
import com.vivacon.dto.sorting_filtering.PageDTO;
import com.vivacon.dto.sorting_filtering.PostFilter;
import com.vivacon.entity.enum_type.Privacy;
import com.vivacon.service.PostService;
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
import java.util.List;
import java.util.Optional;

@Api(value = "Post Controller")
@RestController
@RequestMapping(value = Constants.API_V1 + "/post")
public class PostController {

    private PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    /**
     * This endpoint is used to provide creating post feature
     *
     * @param postRequest
     * @return PostResponse
     */
    @ApiOperation(value = "Creating post")
    @PostMapping()
    public NewsfeedPost createPost(@Valid @RequestBody PostRequest postRequest) {
        return this.postService.createPost(postRequest);
    }

    @ApiOperation(value = "Get list post based on criteria")
    @GetMapping()
    public PageDTO<NewsfeedPost> getAll(
            @RequestParam(value = "author", required = false) Optional<List<Long>> authors,
            @RequestParam(value = "privacy", required = false) Optional<List<Privacy>> statuses,
            @RequestParam(value = "own", required = false) Optional<Boolean> own,
            @RequestParam(value = "q", required = false) Optional<String> keyword,
            @RequestParam(value = "_order", required = false) Optional<String> order,
            @RequestParam(value = "_sort", required = false) Optional<String> sort,
            @RequestParam(value = "limit", required = false) Optional<Integer> pageSize,
            @RequestParam(value = "page", required = false) Optional<Integer> pageIndex) {

        PostFilter postFilter = new PostFilter(authors, statuses, own.orElse(false), true);
        return postService.getAll(postFilter, keyword, order, sort, pageSize, pageIndex);
    }

    @ApiOperation(value = "Get detail post")
    @GetMapping(value = "/{id}")
    public DetailPost getDetailPost(
            @PathVariable(name = "id") Long postId,
            @RequestParam(value = "_order", required = false) Optional<String> order,
            @RequestParam(value = "_sort", required = false) Optional<String> sort,
            @RequestParam(value = "limit", required = false) Optional<Integer> pageSize,
            @RequestParam(value = "page", required = false) Optional<Integer> pageIndex) {
        return postService.getDetailPost(postId, order, sort, pageSize, pageIndex);
    }

    @ApiOperation(value = "Deleting a comment")
    @DeleteMapping(value = "/comment/{id}")
    public ResponseEntity<Object> deleteComment(@PathVariable(name = "id") Long id) {
        this.postService.deactivatePost(id);
        return ResponseEntity.ok(null);
    }
}






















