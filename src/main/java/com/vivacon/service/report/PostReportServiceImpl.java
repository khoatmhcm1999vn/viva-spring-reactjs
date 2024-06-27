package com.vivacon.service.report;

import com.vivacon.common.utility.PageableBuilder;
import com.vivacon.dto.request.PostReportRequest;
import com.vivacon.dto.sorting_filtering.PageDTO;
import com.vivacon.entity.Account;
import com.vivacon.entity.Post;
import com.vivacon.entity.report.PostReport;
import com.vivacon.event.PostReportApprovingEvent;
import com.vivacon.exception.RecordNotFoundException;
import com.vivacon.mapper.PageMapper;
import com.vivacon.mapper.PostReportMapper;
import com.vivacon.repository.PostRepository;
import com.vivacon.repository.report.PostReportRepository;
import com.vivacon.service.AccountService;
import com.vivacon.service.PostService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.NonTransientDataAccessException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class PostReportServiceImpl implements PostReportService {

    private PostReportMapper postReportMapper;

    private PostReportRepository postReportRepository;

    private PostRepository postRepository;

    private PostService postService;

    private AccountService accountService;

    private ApplicationEventPublisher applicationEventPublisher;

    public PostReportServiceImpl(PostReportMapper postReportMapper,
                                 ApplicationEventPublisher applicationEventPublisher,
                                 PostReportRepository postReportRepository,
                                 PostService postService,
                                 AccountService accountService,
                                 PostRepository postRepository) {
        this.postReportMapper = postReportMapper;
        this.postReportRepository = postReportRepository;
        this.applicationEventPublisher = applicationEventPublisher;
        this.postRepository = postRepository;
        this.postService = postService;
        this.accountService = accountService;
    }

    @Transactional(propagation = Propagation.REQUIRED, rollbackFor = {DataIntegrityViolationException.class, NonTransientDataAccessException.class, SQLException.class, Exception.class})
    @Override
    public PostReport createPostReport(PostReportRequest postReportRequest) {
        Post post = postRepository.findById(postReportRequest.getPostId()).orElse(null);
        PostReport postReport = postReportMapper.toPostReport(postReportRequest);
        postReport.setActive(true);
        postReport.setPost(post);

        return postReportRepository.save(postReport);
    }

    @Override
    public PageDTO<PostReport> getAll(Optional<Boolean> isActive, Optional<String> order, Optional<String> sort, Optional<Integer> pageSize, Optional<Integer> pageIndex) {
        Pageable pageable = PageableBuilder.buildPage(order, sort, pageSize, pageIndex, PostReport.class);
        boolean isActiveReport = isActive.isPresent() ? isActive.get() : true;
        Page<PostReport> postReportPage = postReportRepository.findAllByActive(isActiveReport, pageable);
        return PageMapper.toPageDTO(postReportPage);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED, rollbackFor = {DataIntegrityViolationException.class, NonTransientDataAccessException.class, SQLException.class, Exception.class})
    public boolean approvedPostReport(long id) {
        Account principal = accountService.getCurrentAccount();

        PostReport postReport = postReportRepository.findById(id).orElseThrow(RecordNotFoundException::new);
        postReport.setLastModifiedBy(principal);
        postReport.setLastModifiedAt(LocalDateTime.now());
        postReport.setActive(false);
        postService.deactivatePost(postReport.getPost().getId());
        postReportRepository.saveAndFlush(postReport);
        applicationEventPublisher.publishEvent(new PostReportApprovingEvent(this, postReport));
        return true;
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED, rollbackFor = {DataIntegrityViolationException.class, NonTransientDataAccessException.class, SQLException.class, Exception.class})
    public boolean rejectedPostReport(long id) {
        return this.postReportRepository.deactivateById(id) > 0;
    }

    @Override
    public PostReport getDetailPostReport(Long postReportId) {
        return this.postReportRepository.findById(postReportId).orElseThrow(RecordNotFoundException::new);
    }
}
