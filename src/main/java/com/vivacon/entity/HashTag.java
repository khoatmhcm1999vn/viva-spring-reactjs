package com.vivacon.entity;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;

@Entity
@Table(name = "hashtag", uniqueConstraints = {
        @UniqueConstraint(name = "UniqueHashTagName", columnNames = {"name"})
})
public class HashTag {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "hashtag_id_generator")
    @SequenceGenerator(name = "hashtag_id_generator", sequenceName = "hashtag_id_seq", allocationSize = 1)
    private Long id;

    @Column(name = "name", nullable = false, length = 1500)
    private String name;

    public HashTag() {

    }

    public HashTag(Long id, String name) {
        this.id = id;
        this.name = name;
    }

    public HashTag(String name) {
        this.name = name;
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
}
