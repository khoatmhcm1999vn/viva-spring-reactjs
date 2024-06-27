package com.vivacon.repository;

import com.vivacon.entity.Account;
import com.vivacon.entity.Like;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LikeRepository extends JpaRepository<Like, Long> {

    @Modifying
    @Query("DELETE FROM Like liking WHERE liking.post.id = :postId and liking.account.id = :accountId")
    void unlikeByAccountIdAndPostId(@Param("accountId") long accountId, @Param("postId") long postId);

    @Query("SELECT COUNT(liking.id) FROM Like liking WHERE liking.post.id= :postId")
    Long getCountingLike(@Param(value = "postId") Long postId);

    @Query("SELECT liking FROM Like liking WHERE liking.account.id = :accountId AND liking.post.id = :postId")
    Optional<Like> findByIdComposition(@Param("accountId") long accountId, @Param("postId") long postId);

    @Query("SELECT liking.account, liking.id FROM Like liking WHERE liking.post.id = :postId")
    Page<Account> findAllLikeByPostId(@Param("postId") Long postId, Pageable pageable);

    @Query("Select liking.id FROM Like liking WHERE liking.post.id = :postId and liking.account.id = :accountId")
    Optional<Long> findByAccountIdAndPostId(@Param("accountId") long accountId, @Param("postId") long postId);
}
