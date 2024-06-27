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

@Table(name = "participant",
        uniqueConstraints = @UniqueConstraint(columnNames = {"conversation_id", "account_id"}))
@Entity
public class Participant {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "participant_id_generator")
    @SequenceGenerator(name = "participant_id_generator", sequenceName = "participant_id_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(targetEntity = Conversation.class, optional = false)
    @JoinColumn(name = "conversation_id")
    private Conversation conversation;

    @ManyToOne(targetEntity = Account.class, optional = false)
    @JoinColumn(name = "account_id")
    private Account account;

    public Participant() {
    }

    public Participant(Conversation conversation, Account account) {
        this.conversation = conversation;
        this.account = account;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Conversation getConversation() {
        return conversation;
    }

    public void setConversation(Conversation conversation) {
        this.conversation = conversation;
    }

    public Account getAccount() {
        return account;
    }

    public void setAccount(Account account) {
        this.account = account;
    }
}
