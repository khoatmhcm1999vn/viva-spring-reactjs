package com.vivacon.repository.report;

import com.vivacon.entity.report.PostReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PostReportRepository extends JpaRepository<PostReport, Long> {

    @Query("select p from PostReport p where p.active = :active")
    Page<PostReport> findAllByActive(@Param("active") boolean active, Pageable pageable);

    @Modifying
    @Query("UPDATE PostReport p " +
            "SET p.active = false " +
            "WHERE p.id = :id")
    int deactivateById(@Param("id") Long id);

}
