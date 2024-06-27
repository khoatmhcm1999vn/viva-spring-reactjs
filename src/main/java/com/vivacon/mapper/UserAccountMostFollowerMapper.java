package com.vivacon.mapper;

import com.vivacon.dto.AttachmentDTO;
import com.vivacon.dto.response.UserAccountMostFollower;
import com.vivacon.dto.response.UserAccountMostFollowerResponse;
import com.vivacon.repository.AttachmentRepository;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class UserAccountMostFollowerMapper {

    private ModelMapper mapper;

    private AttachmentRepository attachmentRepository;

    public UserAccountMostFollowerMapper(ModelMapper mapper, AttachmentRepository attachmentRepository) {
        this.mapper = mapper;
        this.attachmentRepository = attachmentRepository;
    }

    public UserAccountMostFollowerResponse toUserAccountMostFollower(UserAccountMostFollower accountMostFollower) {
        UserAccountMostFollowerResponse response = mapper.map(accountMostFollower, UserAccountMostFollowerResponse.class);
        List<AttachmentDTO> attachmentDTOS = attachmentRepository
                .findByProfileId(accountMostFollower.getId().longValue())
                .stream().map(attachment -> new AttachmentDTO(attachment.getActualName(), attachment.getUniqueName(), attachment.getUrl()))
                .collect(Collectors.toList());
        response.setAttachments(attachmentDTOS);

        return response;
    }
}
