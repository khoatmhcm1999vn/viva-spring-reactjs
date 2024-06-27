package com.vivacon.service.impl;

import com.vivacon.common.enum_type.RoleType;
import com.vivacon.common.enum_type.VerifyDeviceContext;
import com.vivacon.common.utility.PageableBuilder;
import com.vivacon.dto.request.ChangePasswordRequest;
import com.vivacon.dto.request.ForgotPasswordRequest;
import com.vivacon.dto.request.RegistrationRequest;
import com.vivacon.dto.response.AccountResponse;
import com.vivacon.dto.response.EssentialAccount;
import com.vivacon.dto.sorting_filtering.PageDTO;
import com.vivacon.entity.Account;
import com.vivacon.entity.enum_type.AccountStatus;
import com.vivacon.event.GeneratingVerificationTokenEvent;
import com.vivacon.event.RegistrationCompleteEvent;
import com.vivacon.exception.InvalidPasswordException;
import com.vivacon.exception.RecordNotFoundException;
import com.vivacon.exception.VerificationTokenException;
import com.vivacon.mapper.AccountMapper;
import com.vivacon.mapper.PageMapper;
import com.vivacon.repository.AccountRepository;
import com.vivacon.repository.RoleRepository;
import com.vivacon.security.UserDetailImpl;
import com.vivacon.service.AccountService;
import com.vivacon.service.DeviceService;
import com.vivacon.service.PostService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.NonTransientDataAccessException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.NonUniqueResultException;
import javax.servlet.http.HttpServletRequest;
import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AccountServiceImpl implements AccountService {

    private AccountMapper accountMapper;
    private AccountRepository accountRepository;
    private RoleRepository roleRepository;
    private PasswordEncoder passwordEncoder;
    private ApplicationEventPublisher applicationEventPublisher;
    private PostService postService;

    private DeviceService deviceService;

    public AccountServiceImpl(AccountRepository accountRepository,
                              RoleRepository roleRepository,
                              PasswordEncoder passwordEncoder,
                              AccountMapper accountMapper,
                              PostService postService,
                              DeviceService deviceService,
                              ApplicationEventPublisher applicationEventPublisher) {
        this.accountRepository = accountRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.applicationEventPublisher = applicationEventPublisher;
        this.postService = postService;
        this.accountMapper = accountMapper;
        this.deviceService = deviceService;
    }

    @Override
    public Account getCurrentAccount() {
        UserDetails principal = (UserDetailImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return accountRepository.findByUsernameIgnoreCase(principal.getUsername())
                .orElseThrow(RecordNotFoundException::new);
    }

    @Override
    public Account getAccountById(Long accountId) {
        return accountRepository.findById(accountId)
                .orElseThrow(RecordNotFoundException::new);
    }

    @Override
    public Account getAccountByUsernameIgnoreCase(String username) {
        return this.accountRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(RecordNotFoundException::new);
    }

    @Override
    public AccountResponse checkUniqueUsername(String username) {
        Optional<Account> account = accountRepository.findByUsernameIgnoreCase(username);
        if (account.isPresent()) {
            return accountMapper.toResponse(null, account.get());
        } else {
            throw new RecordNotFoundException("Not match any account in our system");
        }
    }

    @Override
    public AccountResponse checkUniqueEmail(String email) {
        Optional<Account> account = accountRepository.findByEmail(email);
        if (account.isPresent()) {
            return accountMapper.toResponse(null, account.get());
        } else {
            throw new RecordNotFoundException("Not match any account in our system");
        }
    }

    @Override
    public Account registerNewAccount(RegistrationRequest registrationRequest) {
        try {
            Account account = new Account.AccountBuilder()
                    .fullName(registrationRequest.getFullName())
                    .username(registrationRequest.getUsername())
                    .email(registrationRequest.getEmail())
                    .password(passwordEncoder.encode(registrationRequest.getPassword()))
                    .role(roleRepository.findByName(RoleType.USER.toString()))
                    .active(false)
                    .publicKey("each-person-publickey")
                    .createdAt(LocalDateTime.now())
                    .accountStatus(AccountStatus.STILL_NOT_ACTIVE)
                    .build();
            Account savedAccount = accountRepository.saveAndFlush(account);
            applicationEventPublisher.publishEvent(new RegistrationCompleteEvent(this, savedAccount));
            return savedAccount;
        } catch (DataIntegrityViolationException e) {
            throw new NonUniqueResultException("Some fields in the request body are already existing in our system");
        }
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED, rollbackFor = {DataIntegrityViolationException.class, NonTransientDataAccessException.class, SQLException.class, Exception.class})
    public Account activeAccount(String verificationCode) {
        Optional<Account> account = accountRepository.findByVerificationToken(verificationCode);
        if (account.isPresent() && account.get().getVerificationExpiredDate().isAfter(Instant.now())) {
            accountRepository.activateByVerificationToken(verificationCode, AccountStatus.ACTIVE);
            return account.get();
        } else {
            throw new VerificationTokenException("Verification token was invalid. Please make a new resend verified token request");
        }
    }

    @Override
    public Account verifyAccount(HttpServletRequest request, String code) {
        Optional<Account> account = accountRepository.findByVerificationToken(code);
        if (account.isPresent() && account.get().getVerificationExpiredDate().isAfter(Instant.now())) {

            Account existingAccount = account.get();
            deviceService.verifyDevice(request, existingAccount, VerifyDeviceContext.VERIFY);
            existingAccount.setAccountStatus(AccountStatus.ACTIVE);
            accountRepository.save(existingAccount);

            return existingAccount;
        } else {
            throw new VerificationTokenException("Verification token was invalid. Please make a new resend verified token request");
        }
    }

    @Override
    public Account resendVerificationToken(String email) {
        Optional<Account> account = accountRepository.findByEmail(email);
        if (account.isPresent()) {
            applicationEventPublisher.publishEvent(new GeneratingVerificationTokenEvent(this, account.get()));
            return account.get();
        } else {
            throw new RecordNotFoundException("The request verification token is invalid because of wrong email");
        }
    }

    @Override
    public Account forgotPassword(ForgotPasswordRequest forgotPasswordRequest) {
        Optional<Account> account = accountRepository.findByVerificationToken(forgotPasswordRequest.getVerificationToken());
        if (account.isPresent() && account.get().getVerificationExpiredDate().isAfter(Instant.now())) {
            account.get().setPassword(passwordEncoder.encode(forgotPasswordRequest.getNewPassword()));
            return accountRepository.saveAndFlush(account.get());
        } else {
            throw new VerificationTokenException("Verification token was invalid. Please make a new resend verified token request");
        }
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED, rollbackFor = {DataIntegrityViolationException.class, NonTransientDataAccessException.class, SQLException.class, Exception.class})
    public Account changePassword(ChangePasswordRequest changePasswordRequest) {
        Account account = getCurrentAccount();
        if (passwordEncoder.matches(changePasswordRequest.getOldPassword(), account.getPassword())) {
            account.setPassword(passwordEncoder.encode(changePasswordRequest.getNewPassword()));
            return accountRepository.saveAndFlush(account);
        } else {
            throw new InvalidPasswordException();
        }
    }

    @Override
    public PageDTO<EssentialAccount> findByName(String name, Optional<String> order, Optional<String> sort, Optional<Integer> pageSize, Optional<Integer> pageIndex) {
        Pageable pageable = PageableBuilder.buildPage(order, sort, pageSize, pageIndex, Account.class);
        Page<Account> pageAccount = accountRepository.findByApproximatelyName(name, RoleType.USER.toString(), pageable);
        return PageMapper.toPageDTO(pageAccount, account -> accountMapper.toEssentialAccount(account));
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED, rollbackFor = {DataIntegrityViolationException.class, NonTransientDataAccessException.class, SQLException.class, Exception.class})
    public boolean deactivate(Long accountId) {
        List<Long> allIdPost = postService.getAllIdByAccountId(accountId);
        this.postService.deactivatePost(allIdPost);
        return accountRepository.deactivateById(accountId) > 0;
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED, rollbackFor = {DataIntegrityViolationException.class, NonTransientDataAccessException.class, SQLException.class, Exception.class})
    public boolean ban(Long accountId) {
        List<Long> allIdPost = postService.getAllIdByAccountId(accountId);
        this.postService.deactivatePost(allIdPost);
        accountRepository.banById(accountId, AccountStatus.BANNED);
        return true;
    }
}
