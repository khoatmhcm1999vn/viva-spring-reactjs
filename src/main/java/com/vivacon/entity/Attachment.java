package com.vivacon.entity;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "attachment")
public class Attachment {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "attachment_id_generator")
    @SequenceGenerator(name = "attachment_id_generator", sequenceName = "attachment_id_seq", allocationSize = 1)
    private Long id;

    @Column(name = "url")
    private String url;

    @Column(name = "actual_name")
    private String actualName;

    @Column(name = "unique_name")
    private String uniqueName;

    private LocalDateTime timestamp;

    @ManyToOne(targetEntity = Post.class)
    @JoinColumn(name = "post_id")
    private Post post;

    @ManyToOne(targetEntity = Account.class)
    @JoinColumn(name = "profile_id")
    private Account profile;

    public Attachment() {
        this.timestamp = LocalDateTime.now();
    }

    public Attachment(String actualName, String uniqueName, String url, Post post) {
        this();
        this.url = url;
        this.actualName = actualName;
        this.uniqueName = uniqueName;
        this.post = post;
    }

    public Attachment(String actualName, String uniqueName, String url, Account profile) {
        this();
        this.url = url;
        this.actualName = actualName;
        this.uniqueName = uniqueName;
        this.profile = profile;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public Post getPost() {
        return post;
    }

    public void setPost(Post post) {
        this.post = post;
    }

    public String getActualName() {
        return actualName;
    }

    public void setActualName(String name) {
        this.actualName = name;
    }

    public String getUniqueName() {
        return uniqueName;
    }

    public void setUniqueName(String uniqueName) {
        this.uniqueName = uniqueName;
    }

    public Account getProfile() {
        return profile;
    }

    public void setProfile(Account profile) {
        this.profile = profile;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
