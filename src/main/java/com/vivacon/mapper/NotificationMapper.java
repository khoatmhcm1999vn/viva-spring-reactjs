package com.vivacon.mapper;

import com.vivacon.dto.response.NotificationResponse;
import com.vivacon.entity.Account;
import com.vivacon.entity.Notification;
import com.vivacon.exception.RecordNotFoundException;
import com.vivacon.repository.AttachmentRepository;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {

    private ModelMapper mapper;

    private AccountMapper accountMapper;

    private AttachmentRepository attachmentRepository;

    public NotificationMapper(ModelMapper modelMapper,
                              AccountMapper accountMapper,
                              AttachmentRepository attachmentRepository) {
        this.mapper = modelMapper;
        this.accountMapper = accountMapper;
        this.attachmentRepository = attachmentRepository;
    }

    public NotificationResponse toResponse(Notification notification) {
        Account actionAuthor = notification.getActionAuthor();

        NotificationResponse notificationResponse = mapper.map(notification, NotificationResponse.class);
        notificationResponse.setActionAuthor(accountMapper.toEssentialAccount(actionAuthor));

        String firstImage = null;
        switch (notification.getType()) {
            case REPLY_ON_COMMENT: {
            }
            case COMMENT_ON_POST: {
            }
            case AWARE_ON_COMMENT: {
            }
            case LIKE_ON_POST: {
                firstImage = attachmentRepository.findFirstByPostIdOrderByTimestampAsc(notification.getPresentationId())
                        .orElseThrow(RecordNotFoundException::new).getUrl();
                break;
            }
            case FOLLOWING_ON_ME: {
            }
            default: {
            }
        }
        notificationResponse.setDomainImage(firstImage);
        return notificationResponse;
    }
}
