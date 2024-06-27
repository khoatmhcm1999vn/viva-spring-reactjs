package com.vivacon.repository.report;

import com.vivacon.entity.report.AccountReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AccountReportRepository extends JpaRepository<AccountReport, Long> {

    @Query("select a from AccountReport a where a.active = :active")
    Page<AccountReport> findAllByActive(@Param("active") boolean active, Pageable pageable);

    @Modifying
    @Query("UPDATE AccountReport a SET a.active = false WHERE a.id = :id")
    int deactivateById(@Param("id") Long id);
}
