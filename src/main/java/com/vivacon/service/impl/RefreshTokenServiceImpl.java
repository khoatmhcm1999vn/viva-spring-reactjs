package com.vivacon.service.impl;

import com.vivacon.common.constant.Constants;
import com.vivacon.entity.Account;
import com.vivacon.exception.TokenRefreshException;
import com.vivacon.repository.AccountRepository;
import com.vivacon.service.RefreshTokenService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class RefreshTokenServiceImpl implements RefreshTokenService {

    @Value("${vivacon.jwt.refresh_expiration}")
    private Long refreshTokenDurationMs;

    private AccountRepository accountRepository;

    public RefreshTokenServiceImpl(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    /**
     * This method is used to find an account record in database based on the token value
     *
     * @param token
     * @return
     */
    @Override
    public Optional<Account> findAccountByRefreshToken(String token) {
        return accountRepository.findByRefreshToken(token);
    }

    /**
     * This method is used to create a new refresh token
     *
     * @param username
     * @return
     */
    @Override
    public String createRefreshToken(String username) {
        Account account = accountRepository
                .findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new UsernameNotFoundException(Constants.USERNAME_NOT_FOUND));
        account.setTokenExpiredDate(Instant.now().plusMillis(refreshTokenDurationMs));
        account.setRefreshToken(UUID.randomUUID().toString());
        this.accountRepository.flush();
        return account.getRefreshToken();
    }

    /**
     * This method is used to verify a refresh token is expired or not
     *
     * @param account
     * @return
     */
    @Override
    public Account verifyTokenExpiration(Account account) {
        if (account.getTokenExpiredDate().compareTo(Instant.now()) < 0) {
            accountRepository.setRefreshTokenToEmptyByUsername(account.getUsername());
            throw new TokenRefreshException(account.getRefreshToken(), "Refresh token was expired. Please make a new sign in request");
        }
        return account;
    }
}