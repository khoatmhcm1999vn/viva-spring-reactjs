package com.vivacon.service.report;

import com.vivacon.common.utility.PageableBuilder;
import com.vivacon.dto.request.AccountReportRequest;
import com.vivacon.dto.sorting_filtering.PageDTO;
import com.vivacon.entity.Account;
import com.vivacon.entity.report.AccountReport;
import com.vivacon.event.AccountReportApprovingEvent;
import com.vivacon.exception.RecordNotFoundException;
import com.vivacon.mapper.AccountReportMapper;
import com.vivacon.mapper.PageMapper;
import com.vivacon.repository.report.AccountReportRepository;
import com.vivacon.service.AccountService;
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
public class AccountReportServiceImpl implements AccountReportService {

    private AccountReportMapper accountReportMapper;

    private AccountReportRepository accountReportRepository;

    private AccountService accountService;

    private ApplicationEventPublisher applicationEventPublisher;

    public AccountReportServiceImpl(AccountReportMapper accountReportMapper,
                                    AccountReportRepository accountReportRepository,
                                    AccountService accountService,
                                    ApplicationEventPublisher applicationEventPublisher) {
        this.accountReportMapper = accountReportMapper;
        this.accountReportRepository = accountReportRepository;
        this.accountService = accountService;
        this.applicationEventPublisher = applicationEventPublisher;
    }

    @Transactional(propagation = Propagation.REQUIRED, rollbackFor = {DataIntegrityViolationException.class, NonTransientDataAccessException.class, SQLException.class, Exception.class})
    @Override
    public AccountReport createAccountReport(AccountReportRequest accountReportRequest) {
        Account accountById = accountService.getAccountById(accountReportRequest.getAccountId());
        AccountReport accountReport = accountReportMapper.toAccountReport(accountReportRequest);
        accountReport.setActive(true);
        accountReport.setAccount(accountById);

        return accountReportRepository.save(accountReport);
    }

    @Override
    public PageDTO<AccountReport> getAll(Optional<Boolean> isActive, Optional<String> order, Optional<String> sort, Optional<Integer> pageSize, Optional<Integer> pageIndex) {
        Pageable pageable = PageableBuilder.buildPage(order, sort, pageSize, pageIndex, AccountReport.class);
        boolean isActiveReport = isActive.isPresent() ? isActive.get() : true;
        Page<AccountReport> accountReportPage = accountReportRepository.findAllByActive(isActiveReport, pageable);
        return PageMapper.toPageDTO(accountReportPage);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED, rollbackFor = {DataIntegrityViolationException.class, NonTransientDataAccessException.class, SQLException.class, Exception.class})
    public boolean approvedAccountReport(long id) {
        Account principal = accountService.getCurrentAccount();

        AccountReport accountReport = accountReportRepository.findById(id).orElseThrow(RecordNotFoundException::new);
        accountReport.setLastModifiedBy(principal);
        accountReport.setLastModifiedAt(LocalDateTime.now());
        accountReport.setActive(false);

        accountService.ban(accountReport.getAccount().getId());
        accountReportRepository.saveAndFlush(accountReport);
        applicationEventPublisher.publishEvent(new AccountReportApprovingEvent(this, accountReport));
        return true;
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED, rollbackFor = {DataIntegrityViolationException.class, NonTransientDataAccessException.class, SQLException.class, Exception.class})
    public boolean rejectedAccountReport(long id) {
        return this.accountReportRepository.deactivateById(id) > 0;
    }

    @Override
    public AccountReport getDetailAccountReport(Long accountReportId) {
        return accountReportRepository.findById(accountReportId).orElseThrow(RecordNotFoundException::new);
    }
}
