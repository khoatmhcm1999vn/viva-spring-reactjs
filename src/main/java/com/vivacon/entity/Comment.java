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

@Entity
@Table(name = "comment")
public class Comment extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "comment_id_generator")
    @SequenceGenerator(name = "comment_id_generator", sequenceName = "comment_id_seq", allocationSize = 1)
    private Long id;

    @Column(name = "content")
    private String content;

    @ManyToOne(targetEntity = Post.class)
    @JoinColumn(name = "post_id")
    private Post post;

    @ManyToOne(targetEntity = Comment.class)
    @JoinColumn(name = "parent_comment_id")
    private Comment parentComment;

    public Comment() {

    }

    public Comment(Long id, String content, Post post, Comment parentComment) {
        this.id = id;
        this.content = content;
        this.post = post;
        this.parentComment = parentComment;
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

    public Post getPost() {
        return post;
    }

    public void setPost(Post post) {
        this.post = post;
    }

    public Comment getParentComment() {
        return parentComment;
    }

    public void setParentComment(Comment parentComment) {
        this.parentComment = parentComment;
    }
}
