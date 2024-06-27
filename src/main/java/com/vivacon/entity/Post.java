package com.vivacon.entity;

import com.vivacon.entity.enum_type.Privacy;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;

@Entity
@Table(name = "post")
public class Post extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "post_id_generator")
    @SequenceGenerator(name = "post_id_generator", sequenceName = "post_id_seq", allocationSize = 1)
    private Long id;

    @Column(name = "caption", nullable = false, length = 1500)
    private String caption;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "privacy")
    private Privacy privacy;

    public Post() {

    }

    public Post(Long id, String caption, Privacy privacyType) {
        this.id = id;
        this.caption = caption;
        this.privacy = privacyType;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCaption() {
        return caption;
    }

    public void setCaption(String caption) {
        this.caption = caption;
    }

    public Privacy getPrivacy() {
        return privacy;
    }

    public void setPrivacy(Privacy privacyType) {
        this.privacy = privacyType;
    }
}
