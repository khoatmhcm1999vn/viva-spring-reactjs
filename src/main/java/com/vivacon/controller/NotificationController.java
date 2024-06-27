package com.vivacon.controller;

import com.vivacon.dto.response.NotificationResponse;
import com.vivacon.dto.sorting_filtering.PageDTO;
import com.vivacon.entity.enum_type.MessageStatus;
import com.vivacon.service.NotificationService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.Optional;

import static com.vivacon.common.constant.Constants.API_V1;

@RestController
@Api(value = "Notification endpoints")
@RequestMapping(API_V1)
public class NotificationController {

    private NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @ApiOperation(value = "Get all notifications of current user in each page")
    @GetMapping("/notification")
    public PageDTO<NotificationResponse> findAllNotificationByPrincipal(
            @RequestParam(value = "status", required = false) Optional<MessageStatus> status,
            @RequestParam(value = "_order", required = false) Optional<String> order,
            @RequestParam(value = "_sort", required = false) Optional<String> sort,
            @RequestParam(value = "limit", required = false) Optional<Integer> pageSize,
            @RequestParam(value = "page", required = false) Optional<Integer> pageIndex) {
        return notificationService.findAllByPrincipal(status, order, sort, pageSize, pageIndex);
    }

    @ApiOperation(value = "Update the status of notification")
    @PutMapping(value = "/notification/{id}")
    public ResponseEntity<Object> updateTheStatusOfSpecificNotification(@PathVariable(value = "id") long id,
                                                                        @Valid @RequestBody MessageStatus status) {
        if (status.equals(MessageStatus.SENT)) {
            return ResponseEntity.badRequest().body("Invalid request updating notification status");
        }
        notificationService.updateStatus(id, status);
        return ResponseEntity.ok().body(null);
    }

    @ApiOperation(value = "Update all notification from sent status to received status")
    @PutMapping(value = "/notification/status/from/sent/to/received")
    public ResponseEntity<Object> updateAllFromSentToReceived() {
        notificationService.updateAllToStatus(MessageStatus.SENT, MessageStatus.RECEIVED);
        return ResponseEntity.ok().body(null);
    }
}
