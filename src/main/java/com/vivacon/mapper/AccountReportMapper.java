package com.vivacon.mapper;

import com.vivacon.common.utility.AuditableHelper;
import com.vivacon.dto.request.AccountReportRequest;
import com.vivacon.entity.AuditableEntity;
import com.vivacon.entity.report.AccountReport;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class AccountReportMapper {

    private AuditableHelper auditableHelper;

    private ModelMapper modelMapper;

    public AccountReportMapper(AuditableHelper auditableHelper, ModelMapper modelMapper) {
        this.auditableHelper = auditableHelper;
        this.modelMapper = modelMapper;
    }

    public AccountReport toAccountReport(AccountReportRequest accountReportRequest) {
        AccountReport accountReport = this.modelMapper.map(accountReportRequest, AccountReport.class);
        AuditableEntity auditableEntity = auditableHelper.updateAuditingCreatedFields(accountReport, null);
        auditableEntity.setLastModifiedAt(LocalDateTime.now());
        return (AccountReport) auditableEntity;
    }

}
