package com.vivacon.repository.report;

import com.vivacon.entity.report.CommentReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CommentReportRepository extends JpaRepository<CommentReport, Long> {

    @Query("select c from CommentReport c where c.active = :active")
    Page<CommentReport> findAllByActive(@Param("active") boolean active, Pageable pageable);

    @Modifying
    @Query("UPDATE CommentReport c SET c.active = false WHERE c.id = :id")
    int deactivateById(@Param("id") Long id);

}
