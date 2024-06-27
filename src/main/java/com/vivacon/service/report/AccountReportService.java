package com.vivacon.service.report;

import com.vivacon.dto.request.AccountReportRequest;
import com.vivacon.dto.sorting_filtering.PageDTO;
import com.vivacon.entity.report.AccountReport;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.NonTransientDataAccessException;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.sql.SQLException;
import java.util.Optional;

public interface AccountReportService {

    AccountReport createAccountReport(AccountReportRequest accountReportRequest);

    PageDTO<AccountReport> getAll(Optional<Boolean> isActive, Optional<String> order, Optional<String> sort, Optional<Integer> pageSize, Optional<Integer> pageIndex);

    @Transactional(propagation = Propagation.REQUIRED, rollbackFor = {DataIntegrityViolationException.class, NonTransientDataAccessException.class, SQLException.class, Exception.class})
    boolean approvedAccountReport(long id);

    @Transactional(propagation = Propagation.REQUIRED, rollbackFor = {DataIntegrityViolationException.class, NonTransientDataAccessException.class, SQLException.class, Exception.class})
    boolean rejectedAccountReport(long id);

    AccountReport getDetailAccountReport(Long accountReportId);
}
