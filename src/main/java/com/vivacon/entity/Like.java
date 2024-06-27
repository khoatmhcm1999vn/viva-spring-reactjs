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
@Table(name = "liking", uniqueConstraints = {
        @UniqueConstraint(name = "UniqueLikeComposition", columnNames = {"account_id", "post_id"})
})
public class Like {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "liking_id_generator")
    @SequenceGenerator(name = "liking_id_generator", sequenceName = "liking_id_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(targetEntity = Account.class)
    @JoinColumn(name = "account_id")
    private Account account;

    @ManyToOne(targetEntity = Post.class)
    @JoinColumn(name = "post_id")
    private Post post;

    public Like() {

    }

    public Like(Account account, Post post) {
        this.account = account;
        this.post = post;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Account getAccount() {
        return account;
    }

    public void setAccount(Account account) {
        this.account = account;
    }

    public Post getPost() {
        return post;
    }

    public void setPost(Post post) {
        this.post = post;
    }
}