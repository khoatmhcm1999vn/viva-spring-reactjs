package com.vivacon.repository;

import com.vivacon.entity.Setting;
import com.vivacon.entity.enum_type.SettingType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SettingRepository extends JpaRepository<Setting, Long> {

    @Query("select s.value from Setting s where s.type = :type and s.account.id = :accountId")
    Optional<String> findValueByAccountIdAndSettingType(@Param("accountId") long accountId, @Param("type") SettingType type);

    @Modifying
    @Query("update Setting s set s.value = :value where s.type = :type and s.account.id = :accountId")
    int updateValueBySettingTypeAndAccountId(@Param("accountId") long accountId,
                                             @Param("type") SettingType type,
                                             @Param("value") String value);

    @Query("select s from Setting s where s.account.id = :accountId")
    List<Setting> findAllByAccountId(long accountId);
}
