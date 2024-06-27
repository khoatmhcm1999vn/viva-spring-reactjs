package com.vivacon.repository;

import com.vivacon.entity.Attachment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, Long> {

    List<Attachment> findByPostId(Long postId);

    List<Attachment> findByProfileId(Long profileId);

    Page<Attachment> findByProfileId(Long profileId, Pageable pageable);

    Optional<Attachment> findFirstByProfileIdOrderByTimestampDesc(Long profileId);

    Optional<Attachment> findFirstByPostIdOrderByTimestampAsc(Long postId);

    @Query("select count(a.id) from Attachment a where a.post.id = :postId")
    Long getAttachmentCountByPostId(@Param("postId") Long postId);
}
