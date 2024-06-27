package com.vivacon.service;

import com.vivacon.dto.response.NotificationResponse;
import com.vivacon.dto.sorting_filtering.PageDTO;
import com.vivacon.entity.enum_type.MessageStatus;

import java.util.Optional;

public interface NotificationService {

    PageDTO<NotificationResponse> findAllByPrincipal(Optional<MessageStatus> status, Optional<String> order, Optional<String> sort, Optional<Integer> pageSize, Optional<Integer> pageIndex);

    boolean updateStatus(long id, MessageStatus status);

    boolean updateAllToStatus(MessageStatus fromStatus, MessageStatus toStatus);
}
