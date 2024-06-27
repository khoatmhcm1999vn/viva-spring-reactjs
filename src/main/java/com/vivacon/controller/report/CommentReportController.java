package com.vivacon.controller.report;

import com.vivacon.common.constant.Constants;
import com.vivacon.dto.request.CommentReportRequest;
import com.vivacon.dto.sorting_filtering.PageDTO;
import com.vivacon.entity.report.CommentReport;
import com.vivacon.service.report.CommentReportService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.Optional;

@Api(value = "Comment Report Controller")
@RestController
@RequestMapping(value = Constants.API_V1 + "/commentReport")
public class CommentReportController {

    private CommentReportService commentReportService;

    public CommentReportController(CommentReportService commentReportService) {
        this.commentReportService = commentReportService;
    }

    /**
     * This endpoint is used to provide creating comment report feature
     *
     * @param commentReportRequest
     * @return CommentReport
     */
    @ApiOperation(value = "Creating comment report")
    @PostMapping()
    public CommentReport createCommentReport(@Valid @RequestBody CommentReportRequest commentReportRequest) {
        return this.commentReportService.createCommentReport(commentReportRequest);
    }

    @ApiOperation(value = "Get list comment report based on criteria")
    @GetMapping()
    public PageDTO<CommentReport> getAll(
            @RequestParam(value = "isActive", required = false) Optional<Boolean> isActive,
            @RequestParam(value = "_order", required = false) Optional<String> order,
            @RequestParam(value = "_sort", required = false) Optional<String> sort,
            @RequestParam(value = "limit", required = false) Optional<Integer> pageSize,
            @RequestParam(value = "page", required = false) Optional<Integer> pageIndex) {
        return commentReportService.getAll(isActive, order, sort, pageSize, pageIndex);
    }

    @ApiOperation(value = "Approved a comment report")
    @DeleteMapping(value = "/approved/{id}")
    public ResponseEntity<Object> approvedCommentReport(@PathVariable(name = "id") Long id) {
        this.commentReportService.approvedCommentReport(id);
        return ResponseEntity.ok(null);
    }

    @ApiOperation(value = "Rejected a comment report")
    @DeleteMapping(value = "/rejected/{id}")
    public ResponseEntity<Object> rejectedCommentReport(@PathVariable(name = "id") Long id) {
        this.commentReportService.rejectedCommentReport(id);
        return ResponseEntity.ok(null);
    }

    @ApiOperation(value = "Get detail comment report")
    @GetMapping(value = "/{id}")
    public CommentReport getDetailCommentReport(@PathVariable(name = "id") Long commentReportId) {
        return commentReportService.getDetailCommentReport(commentReportId);
    }
}
