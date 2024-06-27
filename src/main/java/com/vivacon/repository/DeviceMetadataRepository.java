package com.vivacon.repository;

import com.vivacon.entity.DeviceMetadata;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DeviceMetadataRepository extends JpaRepository<DeviceMetadata, Long> {

    @Query("select d " +
            "from DeviceMetadata d " +
            "where d.account.id = :accountId and d.country = :country and d.city = :city and d.device = :device ")
    Optional<DeviceMetadata> find(@Param("accountId") Long accountId,
                                  @Param("country") String country,
                                  @Param("city") String city,
                                  @Param("device") String device);


    @Query("select d " +
            "from DeviceMetadata d " +
            "where d.account.id = :accountId")
    Page<DeviceMetadata> findAll(@Param("accountId") Long accountId, Pageable pageable);
}
