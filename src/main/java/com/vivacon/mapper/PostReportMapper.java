package com.vivacon.mapper;

import com.vivacon.common.utility.AuditableHelper;
import com.vivacon.dto.request.PostReportRequest;
import com.vivacon.entity.AuditableEntity;
import com.vivacon.entity.report.PostReport;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class PostReportMapper {

    private AuditableHelper auditableHelper;

    private ModelMapper modelMapper;

    public PostReportMapper(AuditableHelper auditableHelper, ModelMapper modelMapper) {
        this.auditableHelper = auditableHelper;
        this.modelMapper = modelMapper;
    }

    public PostReport toPostReport(PostReportRequest postReportRequest) {
        PostReport postReport = this.modelMapper.map(postReportRequest, PostReport.class);
        AuditableEntity auditableEntity = auditableHelper.updateAuditingCreatedFields(postReport, null);
        auditableEntity.setLastModifiedAt(LocalDateTime.now());
        return (PostReport) auditableEntity;
    }
}
