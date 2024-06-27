package com.vivacon.repository;

import com.vivacon.entity.Post;
import com.vivacon.entity.enum_type.Privacy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostRepository extends JpaRepository<Post, Long>, JpaSpecificationExecutor<Post> {

    @Query("select p " +
            "from Post p " +
            "where p.createdBy.id = :accountId and p.active = :active and p.privacy in (:privacyList)")
    Page<Post> findByAuthorIdAndActive(@Param("accountId") Long accountId,
                                       @Param("active") boolean active,
                                       @Param("privacyList") List<Privacy> privacyList,
                                       Pageable pageable);

    @Query("select count(p.id) " +
            "from Post p " +
            "where p.createdBy.id = :accountId and p.active = true")
    Long getPostCountingByAccountId(@Param("accountId") Long accountId);

    @Query("select count(p.id) " +
            "from Post p " +
            "where p.active = true")
    Long getAllPostCounting();

    @Query("select p " +
            "from Post p " +
            "where p.id = :postId and p.active = :active")
    Optional<Post> findByIdAndActive(@Param("postId") Long postId,
                                     @Param("active") boolean active);

    @Modifying
    @Query("UPDATE Post p " +
            "SET p.active = false " +
            "WHERE p.id = :id")
    int deactivateById(@Param("id") Long id);

    @Query("select p " +
            "from Post p " +
            "where p.createdBy.id = :accountId and p.active = true")
    List<Post> getAllActivePostByAccountId(@Param("accountId") Long accountId);

    @Query("select p " +
            "from Post p " +
            "where p.createdBy.id = :accountId")
    Page<Post> getAllByAccountId(@Param("accountId") Long accountId, Pageable pageable);
}
