package com.vivacon.service;

import com.vivacon.entity.Account;

import java.util.Optional;

public interface RefreshTokenService {

    Optional<Account> findAccountByRefreshToken(String refreshToken);

    String createRefreshToken(String username);

    Account verifyTokenExpiration(Account account);
}
