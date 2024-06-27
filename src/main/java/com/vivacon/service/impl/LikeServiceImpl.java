package com.vivacon.service.impl;

import com.vivacon.common.utility.PageableBuilder;
import com.vivacon.dto.response.OutlineAccount;
import com.vivacon.dto.sorting_filtering.PageDTO;
import com.vivacon.entity.Account;
import com.vivacon.entity.Like;
import com.vivacon.entity.Notification;
import com.vivacon.entity.Post;
import com.vivacon.entity.enum_type.MessageStatus;
import com.vivacon.event.LikeCreatingEvent;
import com.vivacon.exception.RecordNotFoundException;
import com.vivacon.mapper.AccountMapper;
import com.vivacon.mapper.PageMapper;
import com.vivacon.repository.LikeRepository;
import com.vivacon.repository.NotificationRepository;
import com.vivacon.repository.PostRepository;
import com.vivacon.service.AccountService;
import com.vivacon.service.LikeService;
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
import java.time.LocalDateTime;
import java.util.Optional;

import static com.vivacon.entity.enum_type.NotificationType.LIKE_ON_POST;

@Service
public class LikeServiceImpl implements LikeService {

    private AccountService accountService;

    private NotificationRepository notificationRepository;

    private LikeRepository likeRepository;

    private PostRepository postRepository;

    private AccountMapper accountMapper;

    private ApplicationEventPublisher applicationEventPublisher;

    public LikeServiceImpl(AccountMapper accountMapper,
                           LikeRepository likeRepository,
                           AccountService accountService,
                           PostRepository postRepository,
                           NotificationRepository notificationRepository,
                           ApplicationEventPublisher applicationEventPublisher) {
        this.accountMapper = accountMapper;
        this.likeRepository = likeRepository;
        this.accountService = accountService;
        this.postRepository = postRepository;
        this.notificationRepository = notificationRepository;
        this.applicationEventPublisher = applicationEventPublisher;
    }

    @Override
    public boolean like(Long postId) {
        Account currentAccount = accountService.getCurrentAccount();
        Post currentPost = postRepository.findByIdAndActive(postId, true).orElseThrow(RecordNotFoundException::new);
        Like liking = new Like(currentAccount, currentPost);
        try {
            this.likeRepository.save(liking);
            applicationEventPublisher.publishEvent(new LikeCreatingEvent(this, liking));
        } catch (DataIntegrityViolationException e) {
            throw new NonUniqueResultException("The liking table already have one record which contain this account had liked this post before");
        }
        return true;
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED, rollbackFor = {DataIntegrityViolationException.class, NonTransientDataAccessException.class, SQLException.class, Exception.class})
    public boolean unlike(Long postId) {
        Account currentAccount = accountService.getCurrentAccount();
        Optional<Long> existingLike = likeRepository.findByAccountIdAndPostId(currentAccount.getId(), postId);
        if (existingLike.isPresent()) {
            updateLikeNotificationContent(postId, existingLike.get());
            likeRepository.unlikeByAccountIdAndPostId(currentAccount.getId(), postId);
            return true;
        }
        return false;
    }

    private Notification updateLikeNotificationContent(Long postId, Long likeId) {

        Notification notification = notificationRepository
                .findByTypeAndPresentationId(LIKE_ON_POST, postId)
                .orElseThrow(RecordNotFoundException::new);
        Post post = postRepository.findByIdAndActive(postId, true)
                .orElseThrow(RecordNotFoundException::new);
        Long likeCount = likeRepository.getCountingLike(post.getId());

        if (likeCount == 1) {
            notificationRepository.deleteByTypeAndTraceId(LIKE_ON_POST, likeId);
            return null;
        } else {
            String content = likeCount - 1 + " persons like your post";
            notification.setContent(content);
            notification.setTimestamp(LocalDateTime.now());
            notification.setStatus(MessageStatus.SENT);
            return notificationRepository.saveAndFlush(notification);
        }
    }

    @Override
    public PageDTO<OutlineAccount> getAll(Long postId, Optional<String> sort, Optional<String> order, Optional<Integer> pageSize, Optional<Integer> pageIndex) {
        Pageable pageable = PageableBuilder.buildPage(order, sort, pageSize, pageIndex, Like.class);
        Page<Account> pageLikeAccount = likeRepository.findAllLikeByPostId(postId, pageable);
        return PageMapper.toPageDTO(pageLikeAccount, likeAccount -> accountMapper.toOutlineAccount(likeAccount));
    }
}
