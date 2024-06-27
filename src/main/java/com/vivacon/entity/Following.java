package com.vivacon.entity;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;

@Entity
@Table(name = "following", uniqueConstraints = {
        @UniqueConstraint(name = "UniqueFollowingComposition", columnNames = {"from_account", "to_account"})
})
public class Following {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "following_id_generator")
    @SequenceGenerator(name = "following_id_generator", sequenceName = "following_id_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(targetEntity = Account.class)
    @JoinColumn(name = "from_account")
    private Account fromAccount;

    @ManyToOne(targetEntity = Account.class)
    @JoinColumn(name = "to_account")
    private Account toAccount;

    public Following() {
    }

    public Following(Account fromPerson, Account toAccount) {
        this.fromAccount = fromPerson;
        this.toAccount = toAccount;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Account getFromAccount() {
        return fromAccount;
    }

    public void setFromAccount(Account from) {
        this.fromAccount = from;
    }

    public Account getToAccount() {
        return toAccount;
    }

    public void setToAccount(Account to) {
        this.toAccount = to;
    }
}
