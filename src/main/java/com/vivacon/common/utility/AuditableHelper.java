package com.vivacon.common.utility;

import com.vivacon.dto.AuditableResponse;
import com.vivacon.dto.response.AccountResponse;
import com.vivacon.entity.Account;
import com.vivacon.entity.AuditableEntity;
import com.vivacon.exception.RecordNotFoundException;
import com.vivacon.mapper.AccountMapper;
import com.vivacon.repository.AccountRepository;
import com.vivacon.security.UserDetailImpl;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Objects;

@Component
public class AuditableHelper {

    private AccountRepository accountRepository;

    private AccountMapper accountMapper;

    public AuditableHelper(AccountRepository accountRepository,
                           AccountMapper accountMapper) {
        this.accountRepository = accountRepository;
        this.accountMapper = accountMapper;
    }

    public AuditableEntity updateAuditingCreatedFields(AuditableEntity auditable, Account account) {
        if (Objects.isNull(account)) {
            UserDetailImpl principal = (UserDetailImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            account = accountRepository.findByUsernameIgnoreCase(principal.getUsername())
                    .orElseThrow(RecordNotFoundException::new);
        }
        auditable.setCreatedAt(LocalDateTime.now());
        auditable.setCreatedBy(account);
        return auditable;
    }

    public AuditableEntity updateAuditingModifiedFields(AuditableEntity auditable, Account account) {
        if (account == null) {
            UserDetailImpl principal = (UserDetailImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            account = accountRepository.findByUsernameIgnoreCase(principal.getUsername())
                    .orElseThrow(RecordNotFoundException::new);
        }
        auditable.setLastModifiedAt(LocalDateTime.now());
        auditable.setLastModifiedBy(account);
        return auditable;
    }

    public AuditableResponse setupDisplayAuditableFields(AuditableEntity auditableEntity, AuditableResponse auditableResponse) {
        auditableResponse = this.setupDisplayAuditableRelatedToPersonFields(auditableEntity, auditableResponse);
        return this.setupDisplayAuditableRelatedToTimestampFields(auditableEntity, auditableResponse);
    }

    public AuditableResponse setupDisplayAuditableRelatedToPersonFields(AuditableEntity auditableEntity, AuditableResponse auditableResponse) {
        UserDetailImpl principal = (UserDetailImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Account currentAccount = accountRepository.findByUsernameIgnoreCase(principal.getUsername())
                .orElseThrow(RecordNotFoundException::new);
        AccountResponse createdBy = this.accountMapper.toResponse(currentAccount, auditableEntity.getCreatedBy());
        auditableResponse.setCreatedBy(createdBy);
        if (auditableEntity.getLastModifiedBy() != null) {
            AccountResponse updatedBy = this.accountMapper.toResponse(currentAccount, auditableEntity.getLastModifiedBy());
            auditableResponse.setLastModifiedBy(updatedBy);
        }
        return auditableResponse;
    }

    public AuditableResponse setupDisplayAuditableRelatedToTimestampFields(AuditableEntity auditableEntity, AuditableResponse auditableResponse) {
        auditableResponse.setCreatedAt(auditableEntity.getCreatedAt());
        if (auditableEntity.getLastModifiedAt() != null) {
            auditableEntity.setLastModifiedAt(auditableEntity.getLastModifiedAt());
        }
        return auditableResponse;
    }
}
