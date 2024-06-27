package com.vivacon.entity;

import javax.persistence.Column;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.MappedSuperclass;
import java.time.LocalDateTime;

@MappedSuperclass
public abstract class AuditableEntity {

    @ManyToOne
    @JoinColumn(name = "created_by_account_id")
    protected Account createdBy;

    @Column(name = "created_at", nullable = false)
    protected LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "last_modified_by_account_id")
    protected Account lastModifiedBy;

    @Column(name = "last_modified_at")
    protected LocalDateTime lastModifiedAt;

    @Column(nullable = false)
    protected Boolean active;

    protected AuditableEntity() {
    }

    protected AuditableEntity(Account createdBy, LocalDateTime createdAt, Account lastModifiedBy, LocalDateTime lastModifiedAt, Boolean active) {
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.lastModifiedBy = lastModifiedBy;
        this.lastModifiedAt = lastModifiedAt;
        this.active = active;
    }

    public Account getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Account createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Account getLastModifiedBy() {
        return lastModifiedBy;
    }

    public void setLastModifiedBy(Account lastModifiedBy) {
        this.lastModifiedBy = lastModifiedBy;
    }

    public LocalDateTime getLastModifiedAt() {
        return lastModifiedAt;
    }

    public void setLastModifiedAt(LocalDateTime lastModifiedAt) {
        this.lastModifiedAt = lastModifiedAt;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}
