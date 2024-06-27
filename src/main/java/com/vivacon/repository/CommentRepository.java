package com.vivacon.repository;

import com.vivacon.entity.Comment;
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
public interface CommentRepository extends JpaRepository<Comment, Long>, JpaSpecificationExecutor<Comment> {
    @Query("SELECT comment " +
            "FROM Comment comment " +
            "WHERE comment.id = :id and comment.active = :isActive")
    Optional<Comment> findByIdAndActive(@Param(value = "id") long id,
                                        @Param(value = "isActive") boolean isActive);

    @Query("SELECT comment " +
            "FROM Comment comment " +
            "WHERE comment.parentComment.id= :parentCommentId and comment.post.id= :postId AND comment.active = true")
    Page<Comment> findActiveChildCommentsByParentCommentId(@Param(value = "parentCommentId") Long parentCommentId,
                                                           @Param(value = "postId") Long postId, Pageable pageable);

    @Query("SELECT comment " +
            "FROM Comment comment " +
            "WHERE comment.parentComment.id= :parentCommentId and comment.active = :isActive")
    List<Comment> findAllChildCommentsByParentCommentId(@Param(value = "parentCommentId") Long parentCommentId,
                                                        @Param(value = "isActive") boolean isActive);

    @Query("SELECT comment " +
            "FROM Comment comment " +
            "WHERE comment.parentComment.id is null and comment.post.id= :postId AND comment.active = true")
    Page<Comment> findAllActiveFirstLevelComments(@Param(value = "postId") Long postId,
                                                  Pageable pageable);

    @Query("SELECT comment " +
            "FROM Comment comment " +
            "WHERE comment.parentComment.id is null and comment.post.id= :postId AND comment.active = :isActive")
    List<Comment> findAllFirstLevelComments(@Param(value = "postId") Long postId,
                                            @Param(value = "isActive") boolean isActive);

    @Query("SELECT comment " +
            "FROM Comment comment " +
            "WHERE comment.parentComment.id is null and comment.post.id= :postId")
    Page<Comment> findAllFirstLevelComments(@Param(value = "postId") Long postId,
                                            Pageable pageable);

    @Query("SELECT COUNT(comment.id) " +
            "FROM Comment comment " +
            "WHERE comment.parentComment.id = :parentCommentId and comment.post.id= :postId AND comment.active = true")
    Long getCountingChildComments(@Param(value = "parentCommentId") Long parentCommentId,
                                  @Param(value = "postId") Long postId);

    @Query("SELECT COUNT(comment.id) " +
            "FROM Comment comment " +
            "WHERE comment.post.id= :postId AND comment.active = true")
    Long getCountingCommentsByPost(@Param(value = "postId") Long postId);

    @Modifying
    @Query("UPDATE Comment comment " +
            "SET comment.active = false " +
            "WHERE comment.id = :id")
    int deactivateById(@Param("id") Long id);

    @Modifying
    @Query("UPDATE Comment comment " +
            "SET comment.active = false " +
            "WHERE comment.parentComment.id = :parentCommentId")
    int deactivateChildComments(@Param("parentCommentId") Long parentCommentId);

    @Modifying
    @Query("UPDATE Comment comment " +
            "SET comment.active = false " +
            "WHERE comment.post.id = :postId")
    int deactivateByPostId(@Param("postId") Long postId);
}
