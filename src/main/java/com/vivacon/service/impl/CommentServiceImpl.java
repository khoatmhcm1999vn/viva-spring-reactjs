package com.vivacon.service.impl;

import com.vivacon.common.enum_type.RoleType;
import com.vivacon.common.utility.PageableBuilder;
import com.vivacon.dto.request.CommentRequest;
import com.vivacon.dto.response.CommentResponse;
import com.vivacon.dto.sorting_filtering.PageDTO;
import com.vivacon.entity.Comment;
import com.vivacon.entity.Post;
import com.vivacon.event.CommentCreatingEvent;
import com.vivacon.exception.RecordNotFoundException;
import com.vivacon.mapper.CommentMapper;
import com.vivacon.mapper.PageMapper;
import com.vivacon.repository.CommentRepository;
import com.vivacon.repository.PostRepository;
import com.vivacon.service.AccountService;
import com.vivacon.service.CommentService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.NonTransientDataAccessException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.sql.SQLException;
import java.util.Collection;
import java.util.Optional;

@Service
public class CommentServiceImpl implements CommentService {

    private CommentRepository commentRepository;
    private PostRepository postRepository;
    private CommentMapper commentMapper;
    private AccountService accountService;
    private ApplicationEventPublisher applicationEventPublisher;

    public CommentServiceImpl(CommentRepository commentRepository,
                              PostRepository postRepository,
                              CommentMapper commentMapper,
                              AccountService accountService,
                              ApplicationEventPublisher applicationEventPublisher) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.commentMapper = commentMapper;
        this.accountService = accountService;
        this.applicationEventPublisher = applicationEventPublisher;
    }

    @Override
    public CommentResponse createComment(CommentRequest commentRequest) {
        Post post = postRepository.findByIdAndActive(commentRequest.getPostId(), true)
                .orElseThrow(RecordNotFoundException::new);
        Comment parentComment = null;
        if (commentRequest.getParentCommentId() != null) {

            parentComment = commentRepository.findById(commentRequest.getParentCommentId())
                    .orElseThrow(RecordNotFoundException::new);
            if (!parentComment.getPost().getId().equals(commentRequest.getPostId())) {
                throw new RecordNotFoundException("The parent comment is not match with current post of the request!");
            }
        }

        Comment comment = commentMapper.toComment(commentRequest);
        comment.setActive(true);

        comment.setPost(post);
        comment.setParentComment(parentComment);

        Comment savedComment = commentRepository.saveAndFlush(comment);

        applicationEventPublisher.publishEvent(new CommentCreatingEvent(this, savedComment));
        return commentMapper.toResponse(savedComment);
    }

    @Transactional(propagation = Propagation.REQUIRED, rollbackFor = {DataIntegrityViolationException.class, NonTransientDataAccessException.class, SQLException.class, Exception.class})
    @Override
    public boolean deactivateComment(Long commentId) {
        Comment comment = commentRepository.findByIdAndActive(commentId, true)
                .orElseThrow(RecordNotFoundException::new);
        if (comment.getParentComment() == null) {
            deleteChildComments(comment.getId());
        }
        commentRepository.deactivateById(comment.getId());
        return true;
    }

    private boolean deleteChildComments(Long parentCommentId) {
        int numberOfAffectedRows = commentRepository.deactivateChildComments(parentCommentId);
        if (numberOfAffectedRows == 0) {
            return true;
        }
        Collection<Comment> listChildComments = commentRepository.findAllChildCommentsByParentCommentId(parentCommentId, true);
        for (Comment comment : listChildComments) {
            deleteChildComments(comment.getId());
        }
        return true;
    }

    @Override
    public PageDTO<CommentResponse> getAllFirstLevelComment(Optional<String> sort, Optional<String> order, Optional<Integer> pageSize, Optional<Integer> pageIndex, Long postId) {
        Pageable pageable = PageableBuilder.buildPage(order, sort, pageSize, pageIndex, Comment.class);
        Page<Comment> pageComment;
        if (accountService.getCurrentAccount().getRole().getName().equals(RoleType.USER.toString())) {
            pageComment = commentRepository.findAllActiveFirstLevelComments(postId, pageable);
        } else {
            pageComment = commentRepository.findAllFirstLevelComments(postId, pageable);
        }
        return PageMapper.toPageDTO(pageComment, comment -> commentMapper.toResponse(comment));
    }

    @Override
    public PageDTO<CommentResponse> getAllChildComment(Optional<String> sort, Optional<String> order, Optional<Integer> pageSize, Optional<Integer> pageIndex, Long parentCommentId, Long postId) {
        Pageable pageable = PageableBuilder.buildPage(order, sort, pageSize, pageIndex, Comment.class);
        Page<Comment> pageComment = commentRepository.findActiveChildCommentsByParentCommentId(parentCommentId, postId, pageable);
        return PageMapper.toPageDTO(pageComment, comment -> commentMapper.toResponse(comment));
    }
}
