package com.vivacon.service;

import com.vivacon.dto.AttachmentDTO;
import com.vivacon.dto.request.EditProfileInformationRequest;
import com.vivacon.dto.response.AccountInfo;
import com.vivacon.dto.response.DetailProfile;
import com.vivacon.dto.response.OutlinePost;
import com.vivacon.dto.sorting_filtering.PageDTO;
import com.vivacon.entity.enum_type.Privacy;

import java.util.Optional;

public interface ProfileService {

    DetailProfile getProfileByUsername(String username, Optional<Privacy> privacy, Optional<String> order, Optional<String> sort, Optional<Integer> pageSize, Optional<Integer> pageIndex);

    AttachmentDTO changeProfileAvatar(AttachmentDTO avatarDto);

    PageDTO<AttachmentDTO> getProfileAvatarsByAccountId(Long accountId, Optional<Privacy> privacy, Optional<String> order, Optional<String> sort, Optional<Integer> pageSize, Optional<Integer> pageIndex);

    AccountInfo getProfileInformation();

    AccountInfo editProfileInformation(EditProfileInformationRequest editProfileInformationRequest);

    PageDTO<OutlinePost> getOutlinePostByUsername(String username, Optional<Privacy> privacy, Optional<String> order, Optional<String> sort, Optional<Integer> pageSize, Optional<Integer> pageIndex);

    DetailProfile getProfileByUsernameAdminRole(long accountId);
}
