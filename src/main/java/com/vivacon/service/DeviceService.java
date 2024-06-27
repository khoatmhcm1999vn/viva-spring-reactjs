package com.vivacon.service;

import com.vivacon.common.enum_type.VerifyDeviceContext;
import com.vivacon.entity.Account;

import javax.servlet.http.HttpServletRequest;

public interface DeviceService {
    boolean verifyDevice(HttpServletRequest request, Account account, VerifyDeviceContext context);
}
