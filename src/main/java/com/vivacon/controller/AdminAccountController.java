package com.vivacon.controller;

import com.vivacon.common.constant.Constants;
import com.vivacon.dto.request.AdminRegistrationRequest;
import com.vivacon.dto.response.OutlineAccount;
import com.vivacon.dto.sorting_filtering.PageDTO;
import com.vivacon.service.AdminAccountService;
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

import java.util.Optional;

@Api(value = "Admin Controller")
@RestController
@RequestMapping(value = Constants.API_V1)
public class AdminAccountController {

    private AdminAccountService adminAccountService;

    public AdminAccountController(AdminAccountService adminAccountService) {
        this.adminAccountService = adminAccountService;
    }

    @ApiOperation(value = "Get list account admin based on criteria")
    @GetMapping(value = "/admin")
    public PageDTO<OutlineAccount> getAll(
            @RequestParam(value = "_order", required = false) Optional<String> order,
            @RequestParam(value = "_sort", required = false) Optional<String> sort,
            @RequestParam(value = "limit", required = false) Optional<Integer> pageSize,
            @RequestParam(value = "page", required = false) Optional<Integer> pageIndex) {
        return adminAccountService.getAll(sort, order, pageSize, pageIndex);
    }

    @ApiOperation(value = "Create account admin")
    @PostMapping("/admin")
    public ResponseEntity<Object> createAccount(@RequestBody AdminRegistrationRequest registrationRequest) {
        adminAccountService.registerNewAccount(registrationRequest);
        return ResponseEntity.ok().body(null);
    }

    @ApiOperation(value = "Delete account admin")
    @DeleteMapping("/admin/{id}")
    public ResponseEntity<Object> deleteAccount(@PathVariable(name = "id") Long id) {
        adminAccountService.deleteAccount(id);
        return ResponseEntity.ok().body(null);
    }
}
