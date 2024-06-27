package com.vivacon.controller.report;

import com.vivacon.common.constant.Constants;
import com.vivacon.dto.response.DetailPost;
import com.vivacon.dto.response.DetailProfile;
import com.vivacon.service.PostService;
import com.vivacon.service.ProfileService;
import io.swagger.annotations.ApiOperation;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping(value = Constants.API_V1 + "/admin")
public class ReportController {
    private PostService postService;

    private ProfileService profileService;

    public ReportController(PostService postService,
                            ProfileService profileService) {
        this.postService = postService;
        this.profileService = profileService;
    }

    @ApiOperation(value = "Fetching post which has been reported whatever status is active or not")
    @GetMapping("/post/{id}")
    public DetailPost getPostDetail(@PathVariable("id") long postId) {
        return postService.getDetailPostAdminRole(postId, Optional.empty(), Optional.empty(), Optional.empty(), Optional.empty());
    }

    @ApiOperation(value = "Fetching post which has been reported whatever status is active or not")
    @GetMapping("/profile/{id}")
    public DetailProfile getAccount(@PathVariable("id") long accountId) {
        return profileService.getProfileByUsernameAdminRole(accountId);
    }
}
