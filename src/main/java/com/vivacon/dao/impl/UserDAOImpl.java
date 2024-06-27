package com.vivacon.dao.impl;

import com.vivacon.common.enum_type.TimePeriod;
import com.vivacon.dao.StatisticDAO;
import com.vivacon.dao.UserDAO;
import com.vivacon.dto.response.PostsQuantityInCertainTime;
import com.vivacon.dto.response.UserAccountMostFollower;
import com.vivacon.dto.response.UserGeoLocation;
import org.springframework.stereotype.Component;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.ParameterMode;
import javax.persistence.StoredProcedureQuery;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

@Component
public class UserDAOImpl extends StatisticDAO implements UserDAO {

    private EntityManagerFactory entityManagerFactory;
    private EntityManager entityManager;

    public UserDAOImpl(EntityManagerFactory entityManagerFactory,
                       EntityManager entityManager) {
        this.entityManagerFactory = entityManagerFactory;
        this.entityManager = entityManager;
    }

    @Override
    public List<UserAccountMostFollower> getTheTopAccountMostFollowerStatistic(int limit) {
        StoredProcedureQuery procedureQuery;
        procedureQuery = entityManager.createStoredProcedureQuery("getTopAccountMostFollowers");
        return this.fetchingTheTopAccountMostFollowerData(procedureQuery, limit);
    }

    private List<UserAccountMostFollower> fetchingTheTopAccountMostFollowerData(StoredProcedureQuery procedureQuery, int limit) {
        List<UserAccountMostFollower> userAccountMostFollowersList = new ArrayList<>();

        procedureQuery.registerStoredProcedureParameter("limit_value", Integer.class, ParameterMode.IN);
        procedureQuery.setParameter("limit_value", limit);

        if (procedureQuery.execute()) {
            List<Object[]> resultList = procedureQuery.getResultList();

            for (int currentIndex = 0; currentIndex < resultList.size(); currentIndex++) {
                BigInteger accountId = (BigInteger) resultList.get(currentIndex)[0];
                String userName = (String) resultList.get(currentIndex)[1];
                BigInteger accountQuantity = (BigInteger) resultList.get(currentIndex)[2];

                userAccountMostFollowersList.add(new UserAccountMostFollower(accountId, userName, accountQuantity));
            }

            return userAccountMostFollowersList;
        } else {
            return new ArrayList<>();
        }
    }

    @Override
    public List<PostsQuantityInCertainTime> getTheUserQuantityStatisticInTimePeriods(TimePeriod timePeriodOption) {
        StoredProcedureQuery procedureQuery;
        switch (timePeriodOption) {
            case MONTH: {
                procedureQuery = entityManager.createStoredProcedureQuery("userQuantityStatisticInRecentMonths");
                break;
            }
            case QUARTER: {
                procedureQuery = entityManager.createStoredProcedureQuery("userQuantityStatisticInQuarters");
                break;
            }
            case YEAR: {
                procedureQuery = entityManager.createStoredProcedureQuery("userQuantityStatisticInYears");
                break;
            }
            default: {
                return new ArrayList<>();
            }
        }
        return this.fetchingTheQuantityPostStatisticData(procedureQuery);
    }

    @Override
    public String getFollowersPerAccount() {
        // using the same variable name with the stronger scope to override
        EntityManager entityManager = entityManagerFactory.createEntityManager();

        StringBuilder valueBuilder = new StringBuilder();
        StoredProcedureQuery procedureQuery;
        procedureQuery = entityManager.createStoredProcedureQuery("getAllFollowerPerUser");
        procedureQuery.execute();
        List<Object[]> resultList = procedureQuery.getResultList();
        for (int currentIndex = 0; currentIndex < resultList.size(); currentIndex++) {
            Object[] result = resultList.get(currentIndex);
            BigInteger account = (BigInteger) result[0];
            String follower = (String) result[1];
            valueBuilder.append(account + " " + follower + "\t");
        }

        entityManager.close();
        return valueBuilder.toString();
    }

    @Override
    public List<UserGeoLocation> getLoginLocationPerAccount() {
        List<UserGeoLocation> geoLocations = new LinkedList<>();

        StoredProcedureQuery procedureQuery;
        procedureQuery = entityManager.createStoredProcedureQuery("getLastestLoginLocationPerAccount");
        procedureQuery.execute();
        List<Object[]> resultList = procedureQuery.getResultList();
        for (int currentIndex = 0; currentIndex < resultList.size(); currentIndex++) {

            Object[] result = resultList.get(currentIndex);

            long id = ((BigInteger) result[0]).longValue();
            long accountId = ((BigInteger) result[1]).longValue();
            String device = (String) result[2];
            String country = (String) result[3];
            double latitude = (double) result[4];
            double longitude = (double) result[5];

            geoLocations.add(new UserGeoLocation(id, accountId, device, country, latitude, longitude));
        }
        return geoLocations;
    }
}
