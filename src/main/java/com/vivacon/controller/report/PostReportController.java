package com.vivacon.controller.report;

import com.vivacon.common.constant.Constants;
import com.vivacon.dto.request.PostReportRequest;
import com.vivacon.dto.sorting_filtering.PageDTO;
import com.vivacon.entity.report.PostReport;
import com.vivacon.service.report.PostReportService;
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

@Api(value = "Post Report Controller")
@RestController
@RequestMapping(value = Constants.API_V1 + "/postReport")
public class PostReportController {

    private PostReportService postReportService;

    public PostReportController(PostReportService postReportService) {
        this.postReportService = postReportService;
    }

    /**
     * This endpoint is used to provide creating post report feature
     *
     * @param postReportRequest
     * @return PostReport
     */
    @ApiOperation(value = "Creating post report")
    @PostMapping()
    public PostReport createPostReport(@Valid @RequestBody PostReportRequest postReportRequest) {
        return this.postReportService.createPostReport(postReportRequest);
    }

    @ApiOperation(value = "Get list post report based on criteria")
    @GetMapping()
    public PageDTO<PostReport> getAll(
            @RequestParam(value = "isActive", required = false) Optional<Boolean> isActive,
            @RequestParam(value = "_order", required = false) Optional<String> order,
            @RequestParam(value = "_sort", required = false) Optional<String> sort,
            @RequestParam(value = "limit", required = false) Optional<Integer> pageSize,
            @RequestParam(value = "page", required = false) Optional<Integer> pageIndex) {
        return postReportService.getAll(isActive, order, sort, pageSize, pageIndex);
    }

    @ApiOperation(value = "Approved a post report")
    @DeleteMapping(value = "/approved/{id}")
    public ResponseEntity<Object> approvedPostReport(@PathVariable(name = "id") Long id) {
        this.postReportService.approvedPostReport(id);
        return ResponseEntity.ok(null);
    }

    @ApiOperation(value = "Rejected a post report")
    @DeleteMapping(value = "/rejected/{id}")
    public ResponseEntity<Object> rejectedPostReport(@PathVariable(name = "id") Long id) {
        this.postReportService.rejectedPostReport(id);
        return ResponseEntity.ok(null);
    }

    @ApiOperation(value = "Get detail post report")
    @GetMapping(value = "/{id}")
    public PostReport getDetailPostReport(@PathVariable(name = "id") Long postReportId) {
        return postReportService.getDetailPostReport(postReportId);
    }
}
