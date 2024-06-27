package com.vivacon.dao.impl;

import com.vivacon.dao.HashTagDAO;
import com.vivacon.dao.StatisticDAO;
import com.vivacon.dto.response.HashTagQuantityInCertainTime;
import org.springframework.stereotype.Component;

import javax.persistence.EntityManager;
import javax.persistence.ParameterMode;
import javax.persistence.StoredProcedureQuery;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class HashTagDAOImpl extends StatisticDAO implements HashTagDAO {

    private EntityManager entityManager;

    public HashTagDAOImpl(
            EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Override
    public List<HashTagQuantityInCertainTime> getTopTrendingHashTagInCertainTime(LocalDateTime startDate, LocalDateTime endDate, Integer limit) {
        StoredProcedureQuery procedureQuery;
        procedureQuery = entityManager.createStoredProcedureQuery("getTopTrendingHashTagInCertainTime");
        return this.fetchingTopTrendingHashTagInCertainTime(procedureQuery, startDate, endDate, limit);
    }

    private List<HashTagQuantityInCertainTime> fetchingTopTrendingHashTagInCertainTime(StoredProcedureQuery procedureQuery, LocalDateTime startDate, LocalDateTime endDate, Integer limit) {
        List<HashTagQuantityInCertainTime> hashTagQuantityInCertainTimes = new ArrayList<>();

        procedureQuery.registerStoredProcedureParameter("start_date", Timestamp.class, ParameterMode.IN);
        procedureQuery.setParameter("start_date", Timestamp.valueOf(startDate));
        procedureQuery.registerStoredProcedureParameter("end_date", Timestamp.class, ParameterMode.IN);
        procedureQuery.setParameter("end_date", Timestamp.valueOf(endDate));
        procedureQuery.registerStoredProcedureParameter("limit_value", Integer.class, ParameterMode.IN);
        procedureQuery.setParameter("limit_value", limit);

        if (procedureQuery.execute()) {
            List<Object[]> resultList = procedureQuery.getResultList();

            for (int currentIndex = 0; currentIndex < resultList.size(); currentIndex++) {
                String name = (String) resultList.get(currentIndex)[0];
                BigDecimal quantity = (BigDecimal) resultList.get(currentIndex)[1];

                hashTagQuantityInCertainTimes.add(new HashTagQuantityInCertainTime(name, quantity));
            }

            return hashTagQuantityInCertainTimes;
        } else {
            return new ArrayList<>();
        }
    }
}
