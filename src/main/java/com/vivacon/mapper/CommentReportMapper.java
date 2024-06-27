package com.vivacon.mapper;

import com.vivacon.common.utility.AuditableHelper;
import com.vivacon.dto.request.CommentReportRequest;
import com.vivacon.entity.AuditableEntity;
import com.vivacon.entity.report.CommentReport;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class CommentReportMapper {

    private AuditableHelper auditableHelper;

    private ModelMapper modelMapper;

    public CommentReportMapper(AuditableHelper auditableHelper, ModelMapper modelMapper) {
        this.auditableHelper = auditableHelper;
        this.modelMapper = modelMapper;
    }

    public CommentReport toCommentReport(CommentReportRequest commentReportRequest) {
        CommentReport commentReport = this.modelMapper.map(commentReportRequest, CommentReport.class);
        AuditableEntity auditableEntity = auditableHelper.updateAuditingCreatedFields(commentReport, null);
        auditableEntity.setLastModifiedAt(LocalDateTime.now());
        return (CommentReport) auditableEntity;
    }

}
