package com.vivacon.security;

import com.vivacon.common.constant.Constants;
import com.vivacon.entity.Account;
import com.vivacon.repository.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserDetailServiceImpl implements UserDetailsService {

    private AccountRepository accountRepository;

    @Autowired
    public UserDetailServiceImpl(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    /**
     * This method is used to load an account by its username and which will be used by Spring Security Authentication Provider
     *
     * @param username
     * @return UserDetails
     * @throws UsernameNotFoundException
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Account account = this.accountRepository.findByUsernameIgnoreCase(username).orElseThrow(() -> {
            throw new UsernameNotFoundException(Constants.USERNAME_NOT_FOUND);
        });
        return new UserDetailImpl(account);
    }
}