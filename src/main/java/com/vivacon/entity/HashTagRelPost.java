package com.vivacon.entity;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;

@Entity
@Table(name = "hashtag_rel_post")
public class HashTagRelPost {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "hashtag_rel_post_id_generator")
    @SequenceGenerator(name = "hashtag_rel_post_id_generator", sequenceName = "hashtag_rel_post_id_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(targetEntity = HashTag.class)
    @JoinColumn(name = "hashtag_id")
    private HashTag hashTag;

    @ManyToOne(targetEntity = Post.class)
    @JoinColumn(name = "post_id")
    private Post post;

    public HashTagRelPost() {

    }

    public HashTagRelPost(HashTag hashTag, Post post) {
        this.hashTag = hashTag;
        this.post = post;
    }

    public HashTag getHashTag() {
        return hashTag;
    }

    public void setHashTag(HashTag hashTag) {
        this.hashTag = hashTag;
    }

    public Post getPost() {
        return post;
    }

    public void setPost(Post post) {
        this.post = post;
    }
}
