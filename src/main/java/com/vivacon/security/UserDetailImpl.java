package com.vivacon.security;

import com.vivacon.entity.Account;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

public class UserDetailImpl implements UserDetails {

    private String username;

    private String password;

    private List<GrantedAuthority> authorities;

    private Long accountId;

    private boolean active;

    public UserDetailImpl(Account account) {
        List<String> listRoleName = Arrays.asList(account.getRole().getName());
        this.authorities = listRoleName.stream().map(SimpleGrantedAuthority::new).collect(Collectors.toList());
        this.username = account.getUsername();
        this.password = account.getPassword();
        this.accountId = account.getId();
        this.active = account.getActive();
    }

    public Long getAccountId() {
        return accountId;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return this.authorities;
    }

    @Override
    public String getPassword() {
        return this.password;
    }

    @Override
    public String getUsername() {
        return this.username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}