package com.vivacon.service.impl;

import com.vivacon.common.utility.PageableBuilder;
import com.vivacon.dto.response.NotificationResponse;
import com.vivacon.dto.sorting_filtering.PageDTO;
import com.vivacon.entity.Account;
import com.vivacon.entity.Notification;
import com.vivacon.entity.enum_type.MessageStatus;
import com.vivacon.mapper.NotificationMapper;
import com.vivacon.mapper.PageMapper;
import com.vivacon.repository.NotificationRepository;
import com.vivacon.service.AccountService;
import com.vivacon.service.NotificationService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.NonTransientDataAccessException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.sql.SQLException;
import java.util.Optional;

@Service
public class NotificationServiceImpl implements NotificationService {

    private NotificationRepository notificationRepository;
    private AccountService accountService;
    private NotificationMapper notificationMapper;

    public NotificationServiceImpl(NotificationRepository notificationRepository,
                                   AccountService accountService,
                                   NotificationMapper notificationMapper) {
        this.notificationRepository = notificationRepository;
        this.accountService = accountService;
        this.notificationMapper = notificationMapper;
    }

    @Override
    public PageDTO<NotificationResponse> findAllByPrincipal(Optional<MessageStatus> status, Optional<String> order,
                                                            Optional<String> sort, Optional<Integer> pageSize, Optional<Integer> pageIndex) {
        Pageable pageable = PageableBuilder.buildPage(order, sort, pageSize, pageIndex, Notification.class);
        Account currentAccount = accountService.getCurrentAccount();
        Page<Notification> pageNotification;
        if (status.isEmpty()) {
            pageNotification = notificationRepository.findByReceiverId(currentAccount.getId(), pageable);
        } else {
            pageNotification = notificationRepository.findByReceiverIdAndStatus(currentAccount.getId(), status.get(), pageable);
        }
        return PageMapper.toPageDTO(pageNotification, notification -> notificationMapper.toResponse(notification));
    }

    @Transactional(propagation = Propagation.REQUIRED, rollbackFor = {DataIntegrityViolationException.class, NonTransientDataAccessException.class, SQLException.class, Exception.class})
    @Override
    public boolean updateStatus(long id, MessageStatus status) {
        return notificationRepository.updateStatus(id, status) > 0;
    }

    @Transactional(propagation = Propagation.REQUIRED, rollbackFor = {DataIntegrityViolationException.class, NonTransientDataAccessException.class, SQLException.class, Exception.class})
    @Override
    public boolean updateAllToStatus(MessageStatus fromStatus, MessageStatus toStatus) {
        Long receiverId = accountService.getCurrentAccount().getId();
        return notificationRepository.updateAllFromStatusToStatus(receiverId, fromStatus, toStatus) > 0;
    }
}
