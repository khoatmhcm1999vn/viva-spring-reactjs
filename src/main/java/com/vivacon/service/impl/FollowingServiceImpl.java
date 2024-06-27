package com.vivacon.service.impl;

import com.vivacon.common.utility.PageableBuilder;
import com.vivacon.dto.response.AccountResponse;
import com.vivacon.dto.sorting_filtering.PageDTO;
import com.vivacon.entity.Account;
import com.vivacon.entity.Following;
import com.vivacon.event.FollowingEvent;
import com.vivacon.mapper.AccountMapper;
import com.vivacon.mapper.PageMapper;
import com.vivacon.repository.FollowingRepository;
import com.vivacon.repository.NotificationRepository;
import com.vivacon.service.AccountService;
import com.vivacon.service.FollowingService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.NonTransientDataAccessException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.NonUniqueResultException;
import java.sql.SQLException;
import java.util.Optional;

import static com.vivacon.entity.enum_type.NotificationType.FOLLOWING_ON_ME;

@Service
public class FollowingServiceImpl implements FollowingService {

    private FollowingRepository followingRepository;

    private AccountMapper accountMapper;

    private AccountService accountService;

    private NotificationRepository notificationRepository;

    private ApplicationEventPublisher applicationEventPublisher;

    public FollowingServiceImpl(FollowingRepository followingRepository,
                                AccountMapper accountMapper,
                                AccountService accountService,
                                NotificationRepository notificationRepository,
                                ApplicationEventPublisher applicationEventPublisher) {
        this.followingRepository = followingRepository;
        this.accountMapper = accountMapper;
        this.accountService = accountService;
        this.notificationRepository = notificationRepository;
        this.applicationEventPublisher = applicationEventPublisher;
    }


    @Override
    public boolean follow(Long toAccountId) {
        Account fromAccount = accountService.getCurrentAccount();
        Account toAccount = accountService.getAccountById(toAccountId);

        Following following = new Following(fromAccount, toAccount);
        try {
            Following savedFollowing = followingRepository.save(following);
            applicationEventPublisher.publishEvent(new FollowingEvent(this, savedFollowing));
        } catch (DataIntegrityViolationException e) {
            throw new NonUniqueResultException("The following table already have one record which contain this account follow that account");
        }
        return true;
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED, rollbackFor = {DataIntegrityViolationException.class, NonTransientDataAccessException.class, SQLException.class, Exception.class})
    public boolean unfollow(Long toAccountId) {
        Account fromAccount = accountService.getCurrentAccount();
        Account toAccount = this.accountService.getAccountById(toAccountId);

        Optional<Following> existingFollowing = followingRepository.findByIdComposition(fromAccount.getId(), toAccount.getId());
        if (existingFollowing.isPresent()) {
            notificationRepository.deleteByTypeAndTraceId(FOLLOWING_ON_ME, existingFollowing.get().getId());
        }

        this.followingRepository.unfollowById(fromAccount.getId(), toAccount.getId());
        return true;
    }

    @Override
    public PageDTO<AccountResponse> findFollower(Long fromAccountId, Optional<String> sort, Optional<String> order, Optional<Integer> pageSize, Optional<Integer> pageIndex) {
        Pageable pageable = PageableBuilder.buildPage(order, sort, pageSize, pageIndex, Account.class);
        Page<Account> pageFollower = this.followingRepository.findFollower(fromAccountId, pageable);
        Account principal = accountService.getCurrentAccount();
        return PageMapper.toPageDTO(pageFollower, account -> accountMapper.toResponse(principal, account));
    }

    @Override
    public PageDTO<AccountResponse> findFollowing(Long fromAccountId, Optional<String> sort, Optional<String> order, Optional<Integer> pageSize, Optional<Integer> pageIndex) {
        Pageable pageable = PageableBuilder.buildPage(order, sort, pageSize, pageIndex, Account.class);
        Page<Account> pageFollowing = this.followingRepository.findFollowing(fromAccountId, pageable);
        Account principal = accountService.getCurrentAccount();
        return PageMapper.toPageDTO(pageFollowing, account -> accountMapper.toResponse(principal, account));
    }
}
