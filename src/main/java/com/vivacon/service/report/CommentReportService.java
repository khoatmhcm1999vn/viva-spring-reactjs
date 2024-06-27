package com.vivacon.service.report;

import com.vivacon.dto.request.CommentReportRequest;
import com.vivacon.dto.sorting_filtering.PageDTO;
import com.vivacon.entity.report.CommentReport;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.NonTransientDataAccessException;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.sql.SQLException;
import java.util.Optional;

public interface CommentReportService {

    CommentReport createCommentReport(CommentReportRequest commentReportRequest);

    PageDTO<CommentReport> getAll(Optional<Boolean> isActive, Optional<String> order, Optional<String> sort, Optional<Integer> pageSize, Optional<Integer> pageIndex);

    @Transactional(propagation = Propagation.REQUIRED, rollbackFor = {DataIntegrityViolationException.class, NonTransientDataAccessException.class, SQLException.class, Exception.class})
    boolean approvedCommentReport(long id);

    @Transactional(propagation = Propagation.REQUIRED, rollbackFor = {DataIntegrityViolationException.class, NonTransientDataAccessException.class, SQLException.class, Exception.class})
    boolean rejectedCommentReport(long id);

    CommentReport getDetailCommentReport(Long commentReportId);
}
