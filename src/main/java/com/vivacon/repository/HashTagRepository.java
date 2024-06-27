package com.vivacon.repository;

import com.vivacon.entity.HashTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HashTagRepository extends JpaRepository<HashTag, Long> {

    Optional<HashTag> findByNameIgnoreCase(String hashTagName);

    @Query("select count(h.id) from HashTag h")
    Long getAllHashTagCounting();
}
