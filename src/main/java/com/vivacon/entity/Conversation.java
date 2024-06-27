package com.vivacon.entity;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "conversation")
public class Conversation extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "conversation_id_generator")
    @SequenceGenerator(name = "conversation_id_generator", sequenceName = "conversation_id_seq", allocationSize = 1)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    public Conversation() {
    }

    public Conversation(String name) {
        this.name = name;
        this.createdAt = LocalDateTime.now();
        this.lastModifiedAt = LocalDateTime.now();
        this.active = true;
    }

    public Conversation(long id, String name, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.createdAt = LocalDateTime.now();
        this.lastModifiedAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}