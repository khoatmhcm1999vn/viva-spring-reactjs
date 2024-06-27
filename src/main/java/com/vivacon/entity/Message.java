package com.vivacon.entity;

import com.vivacon.entity.enum_type.MessageStatus;
import com.vivacon.entity.enum_type.MessageType;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;
import java.time.LocalDateTime;

@Table(name = "message")
@Entity
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "message_id_generator")
    @SequenceGenerator(name = "message_id_generator", sequenceName = "message_id_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(targetEntity = Account.class, fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id")
    private Account sender;

    @ManyToOne(targetEntity = Conversation.class, fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id")
    private Conversation recipient;

    @Column(name = "content", nullable = false)
    private String content;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "status")
    private MessageStatus status;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "message_type")
    private MessageType messageType;

    public Message() {
    }

    public Message(Account sender, Conversation recipient, String content, LocalDateTime timestamp, MessageStatus status, MessageType messageType) {
        this.sender = sender;
        this.recipient = recipient;
        this.content = content;
        this.timestamp = timestamp;
        this.status = status;
        this.messageType = messageType;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Account getSender() {
        return sender;
    }

    public void setSender(Account sender) {
        this.sender = sender;
    }

    public Conversation getRecipient() {
        return recipient;
    }

    public void setRecipient(Conversation recipient) {
        this.recipient = recipient;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String message) {
        this.content = message;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public MessageStatus getStatus() {
        return status;
    }

    public void setStatus(MessageStatus status) {
        this.status = status;
    }

    public MessageType getMessageType() {
        return messageType;
    }

    public void setMessageType(MessageType messageType) {
        this.messageType = messageType;
    }
}