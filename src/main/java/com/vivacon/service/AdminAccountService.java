package com.vivacon.service;

import com.vivacon.dto.request.AdminRegistrationRequest;
import com.vivacon.dto.response.OutlineAccount;
import com.vivacon.dto.sorting_filtering.PageDTO;
import com.vivacon.entity.Account;

import java.util.Optional;

public interface AdminAccountService {

    PageDTO<OutlineAccount> getAll(Optional<String> sort, Optional<String> order, Optional<Integer> pageSize, Optional<Integer> pageIndex);

    Account registerNewAccount(AdminRegistrationRequest registrationRequest);

    boolean deleteAccount(Long id);

}
