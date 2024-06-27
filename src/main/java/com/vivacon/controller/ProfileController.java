package com.vivacon.controller;

import com.vivacon.common.constant.Constants;
import com.vivacon.dto.AttachmentDTO;
import com.vivacon.dto.request.EditProfileInformationRequest;
import com.vivacon.dto.response.AccountInfo;
import com.vivacon.dto.response.AccountResponse;
import com.vivacon.dto.response.DetailProfile;
import com.vivacon.dto.response.OutlinePost;
import com.vivacon.dto.response.RecommendAccountResponse;
import com.vivacon.dto.sorting_filtering.PageDTO;
import com.vivacon.entity.enum_type.Privacy;
import com.vivacon.service.AccountService;
import com.vivacon.service.FollowingService;
import com.vivacon.service.ProfileService;
import com.vivacon.service.recommendation.RecommendationService;
import io.swagger.annotations.ApiOperation;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = Constants.API_V1)
public class ProfileController {

    private ProfileService profileService;

    private FollowingService followingService;

    private RecommendationService recommendationService;

    private AccountService accountService;

    public ProfileController(ProfileService profileService,
                             RecommendationService recommendationService,
                             AccountService accountService,
                             FollowingService followingService) {
        this.profileService = profileService;
        this.followingService = followingService;
        this.recommendationService = recommendationService;
        this.accountService = accountService;
    }

    @ApiOperation(value = "Get list following of an account")
    @GetMapping("/profile/{username}")
    public DetailProfile getTheDetailProfile(
            @PathVariable(value = "username") String username,
            @RequestParam(value = "_order", required = false) Optional<Privacy> privacy,
            @RequestParam(value = "_order", required = false) Optional<String> order,
            @RequestParam(value = "_sort", required = false) Optional<String> sort,
            @RequestParam(value = "limit", required = false) Optional<Integer> pageSize,
            @RequestParam(value = "page", required = false) Optional<Integer> pageIndex) {
        return profileService.getProfileByUsername(username, privacy, order, sort, pageSize, pageIndex);
    }

    @ApiOperation(value = "Get list outlinePost of an account")
    @GetMapping("/profile/{username}/outline-post")
    public PageDTO<OutlinePost> getAll(@PathVariable(value = "username") String username,
                                       @RequestParam(value = "privacy", required = false) Optional<Privacy> privacy,
                                       @RequestParam(value = "_order", required = false) Optional<String> order,
                                       @RequestParam(value = "_sort", required = false) Optional<String> sort,
                                       @RequestParam(value = "limit", required = false) Optional<Integer> pageSize,
                                       @RequestParam(value = "page", required = false) Optional<Integer> pageIndex) {
        return profileService.getOutlinePostByUsername(username, privacy, order, sort, pageSize, pageIndex);
    }

    @ApiOperation(value = "Get the list of the profile avatar of an specific account")
    @GetMapping("/profile/{id}/avatar")
    public PageDTO<AttachmentDTO> getListProfileAvatars(@PathVariable(value = "id") Long accountId,
                                                        @RequestParam(value = "privacy", required = false) Optional<Privacy> privacy,
                                                        @RequestParam(value = "_order", required = false) Optional<String> order,
                                                        @RequestParam(value = "_sort", required = false) Optional<String> sort,
                                                        @RequestParam(value = "limit", required = false) Optional<Integer> pageSize,
                                                        @RequestParam(value = "page", required = false) Optional<Integer> pageIndex) {
        return profileService.getProfileAvatarsByAccountId(accountId, privacy, order, sort, pageSize, pageIndex);
    }

    @ApiOperation(value = "Change the profile avatar")
    @PostMapping("/profile/avatar")
    public AttachmentDTO changeProfileAvatar(@Valid @RequestBody AttachmentDTO avatar) {
        return profileService.changeProfileAvatar(avatar);
    }

    @ApiOperation(value = "Get the profile information")
    @GetMapping("/profile/info")
    public AccountInfo getProfileInformation() {
        AccountInfo profileInformation = profileService.getProfileInformation();
        return profileInformation;
    }

    @ApiOperation(value = "Edit the profile information")
    @PutMapping("/profile/edit")
    public AccountInfo editProfileInformation(@Valid @RequestBody EditProfileInformationRequest editProfileInformationRequest) {
        return profileService.editProfileInformation(editProfileInformationRequest);
    }

    @ApiOperation(value = "Get recommend account")
    @GetMapping("/account/recommend")
    public Set<RecommendAccountResponse> getRecommendationInNewsFeed() {
        Long principalId = accountService.getCurrentAccount().getId();
        return recommendationService.getRecommendAccountToFollowByAccountId(principalId);
    }

    @ApiOperation(value = "Get recommend account")
    @GetMapping("/account/recommend/profile/{id}")
    public Set<AccountResponse> getRecommendationInNewsFeed(@PathVariable("id") long accountId) {
        return followingService.findFollowing(accountId, Optional.empty(), Optional.empty(),
                        Optional.of(10), Optional.of(0))
                .getContent().stream()
                .filter(accountResponse -> accountResponse.isFollowing() == false)
                .collect(Collectors.toSet());
    }
}
