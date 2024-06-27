package com.vivacon.entity.report;

import com.vivacon.common.enum_type.SentitiveType;
import com.vivacon.entity.AuditableEntity;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Inheritance;
import javax.persistence.InheritanceType;

@Entity(name = "ReportTemplate")
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class ReportTemplate extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(name = "content", nullable = false, length = 3000)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "sentitive_type")
    private SentitiveType sentitiveType;

    public ReportTemplate() {

    }

    public ReportTemplate(Long id, String content, SentitiveType sentitiveType) {
        this.id = id;
        this.content = content;
        this.sentitiveType = sentitiveType;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public SentitiveType getSentitiveType() {
        return sentitiveType;
    }

    public void setSentitiveType(SentitiveType sentitiveType) {
        this.sentitiveType = sentitiveType;
    }
}
