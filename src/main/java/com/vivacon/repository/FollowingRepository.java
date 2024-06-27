package com.vivacon.repository;

import com.vivacon.entity.Account;
import com.vivacon.entity.Following;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FollowingRepository extends JpaRepository<Following, Long> {

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM Following following " +
            "WHERE following.fromAccount.id = :fromId AND following.toAccount.id = :toId")
    void unfollowById(@Param("fromId") long fromId, @Param("toId") long toId);

    @Query("SELECT following " +
            "FROM Following following " +
            "WHERE following.fromAccount.id = :fromId AND following.toAccount.id = :toId")
    Optional<Following> findByIdComposition(@Param("fromId") long fromId, @Param("toId") long toId);

    @Query("SELECT following.fromAccount " +
            "FROM Following following " +
            "WHERE following.toAccount.id = :toAccountId")
    Page<Account> findFollower(@Param(value = "toAccountId") Long toAccountId, Pageable pageable);

    @Query("SELECT following.toAccount " +
            "FROM Following following " +
            "WHERE following.fromAccount.id = :fromAccountId")
    List<Account> findFollowing(@Param(value = "fromAccountId") Long fromAccountId);

    @Query("SELECT following.toAccount " +
            "FROM Following following " +
            "WHERE following.fromAccount.id = :fromAccountId")
    Page<Account> findFollowing(@Param(value = "fromAccountId") Long fromAccountId, Pageable pageable);

    @Query("SELECT count(following.fromAccount.id)" +
            "FROM Following following " +
            "WHERE following.toAccount.id = :accountId")
    Long getFollowerCountingByAccountId(@Param(value = "accountId") Long accountId);

    @Query("SELECT count(following.toAccount.id) " +
            "FROM Following following " +
            "WHERE following.fromAccount.id = :accountId")
    Long getFollowingCountingByAccountId(@Param(value = "accountId") Long accountId);
}
