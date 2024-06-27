package com.vivacon.repository;

import com.vivacon.dto.response.TopHashTagResponse;
import com.vivacon.entity.HashTagRelPost;
import com.vivacon.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface HashTagRelPostRepository extends JpaRepository<HashTagRelPost, Long> {
    @Query("SELECT new com.vivacon.dto.response.TopHashTagResponse(hashTagRel.hashTag.id, hashTagRel.hashTag.name, COUNT(hashTagRel.id)) " +
            "FROM HashTagRelPost hashTagRel " +
            "GROUP BY hashTagRel.hashTag.id, hashTagRel.hashTag.name " +
            "ORDER BY COUNT(hashTagRel.id) DESC")
    Page<TopHashTagResponse> findTopHashTag(Pageable pageable);

    @Query("SELECT h.post FROM HashTagRelPost h WHERE h.hashTag.id = :id")
    Page<Post> findByHashTagId(@Param("id") Long id, Pageable pageable);

    @Query("select count(h.id) from HashTagRelPost h")
    Long getAllHashTagCounting();
}
